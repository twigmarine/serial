const _ = require('lodash/fp')
// import { mergeWith } from 'prairie'
const SerialPort = require('serialport')
const {
  bindNodeCallback, defer, from, fromEvent, of,
} = require('rxjs')

const {
  concatMap, delay, find, mapTo,
  mergeAll, repeatWhen, tap,
} = require('rxjs/operators')

const { createExchange } = require('@twigmarine/rx-exchange')

const list = defer(() => from(SerialPort.list()))

const findPort = (search) => list.pipe(
  repeatWhen((obs) => obs.pipe(delay(2500))),
  tap(_.flow(_.map(_.pick(['path', 'vendorId'])), console.log)),
  mergeAll(),
  find(_.matches(search)),
)

function createPort(path, options = {}) {
  const state = {
    path,
    exchangeId: 0,
    options: { ...options, autoOpen: false },
  }

  const port = new SerialPort(state.path, state.options)

  const onMessage = fromEvent(port, 'data')
  // port.on('data', (x) => console.log('data', x))
  const open = () => bindNodeCallback(port.open.bind(port))()
    .pipe(mapTo({
      payload: { path: state.path, message: 'socket bound', open: true },
      type: 'SERIAL_PORT:OPEN',
    }))
  const close = () => bindNodeCallback(port.close.bind(port))()
    .pipe(mapTo({
      payload: { path: state.path, message: 'socket closed', open: false },
      type: 'SERIAL_PORT:CLOSE',
    }))
  const portWrite = bindNodeCallback(port.write.bind(port))

  function write(txBytes) {
    return defer(() => of({ txBytes, txTime: _.now() })).pipe(
      concatMap((info) => portWrite(info.txBytes).pipe(mapTo(info))),
    )
  }

  const exchange = createExchange(write, onMessage)

  return {
    close,
    exchange,
    open,
    write,
    onMessage,
  }
}

module.exports = {
  createPort,
  findPort,
  list,
}
