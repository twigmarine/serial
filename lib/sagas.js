import _ from 'lodash/fp'
import { END, eventChannel } from 'redux-saga'
import {
  all, call, delay, fork, put, select, take, takeEvery, takeLatest,
} from 'redux-saga/effects'
import SerialPort from 'serialport'
import {
  serialList, serialData, serialOpen, SERIAL_LIST, SERIAL_OPEN, SERIAL_WRITE, serialOpened,
} from './actions'
// import ByteLength from '@serialport/parser-byte-length'

// export const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// worker Saga: will be fired on SERIAL_LIST actions
function* listPorts() {
  try {
    const payload = yield call(SerialPort.list)
    yield put({ type: 'SERIAL_LIST_SUCCEEDED', payload })
  } catch (e) {
    yield put({ type: 'SERIAL_LIST_FAILED', message: e.message })
  }
}

function* serialListCheck() {
  let i = 0
  while (true) {
    const action = yield take(SERIAL_LIST)
    if (i > 0) {
      yield delay(3000)
    }
    i += 1
    yield listPorts(action)
  }
  // yield takeLatest("SERIAL_LIST", listPorts);
}

function* checkFoundPort(action) {
  const state = yield select()
  const search = _.get('serial.search', state)
  if (!search) return
  const portInfo = _.find(search, action.payload)
  if (portInfo) {
    yield put(serialOpen(portInfo))
  } else {
    yield put(serialList())
  }
}

function* searchList() {
  yield takeLatest('SERIAL_LIST_SUCCEEDED', checkFoundPort)
}

function portListen(port) {
  return eventChannel((emitter) => {
    function handleData(data) {
      emitter({ data, time: _.now() })
    }
    port.on('data', handleData)
    port.on('close', () => emitter(END))
    // The subscriber must return an unsubscribe function
    return () => {
      port.removeListener('data', handleData)
    }
  })
}

function* portWrite(port) {
  function portWriteData(action) {
    return new Promise((resolve, reject) => {
      port.write(action.payload, (err) => (err ? reject(err) : resolve()))
    })
  }
  yield takeEvery(SERIAL_WRITE, portWriteData)
}

function initPort(path, options) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort(path, options, (err) => (err ? reject(err) : resolve(port)))
  })
}

function* portFlow(path, baudRate) {
  const port = yield call(initPort, path, { baudRate })
  yield fork(portWrite, port)
  const portChannel = yield call(portListen, port)
  yield put(serialOpened())
  try {
    while (true) {
      // take(END) will cause the saga to terminate by jumping to the finally block
      const portEvent = yield take(portChannel)
      if (portEvent.data) {
        yield put(serialData(portEvent))
      }
    }
  } finally {
    console.log('serial port terminated')
  }
}

function* handleInterface() {
  while (true) {
    const action = yield take(SERIAL_OPEN)
    const state = yield select()
    const path = _.get('payload.path', action) || _.get('serial.path', state)
    const baudRate = _.get('payload.baudRate', action) || _.get('serial.baudRate', state)
    const isRunning = _.get('serial.isRunning', state)
    if (!isRunning) {
      yield call(portFlow, path, baudRate)
    }
    yield take('SERIAL_CLOSE')
  }
}

export default function* rootSaga() {
  yield all([
    serialListCheck(),
    searchList(),
    handleInterface(),
  ])
}
