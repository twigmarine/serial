import _ from 'lodash/fp'
import SerialPort from 'serialport'

export default function createPort(config) {
  let state = { ...config }
  const set = (path, value) => { state = _.set(path, value, state) }
  const get = (path, defaultVal) => (path ? _.getOr(defaultVal, path, state) : state)

  let port = {}
  let exchangeRx = _.noop

  function handleData(data) {
    console.log('data', data)
    exchangeRx(data)
    const onData = get('config.onData')
    if (_.isFunction(onData)) onData(data)
  }
  function close() {
    return port.close()
  }
  function open(path, options) {
    if (path) set('path', path)
    if (options) set('options', options)
    return new Promise((resolve, reject) => {
      console.log('open port', state.path)
      port = new SerialPort(state.path, state.options, (err) => {
        if (err) return reject(err)
        console.log('port open')
        return resolve(port)
      })
      // Switches the port into "flowing mode"
      port.on('data', handleData)
    })
  }

  // will emit data if there is a pause between packets of at least 20ms
  // const parser = port.pipe(new InterByteTimeout({ interval: 20 }))
  // parser.on('data', handleData)
  function write(payload) {
    console.log('write', payload)
    return new Promise((resolve, reject) => {
      port.write(payload, (err) => (err ? reject(err) : resolve()))
    })
  }

  function exchange(txBytes, rxByteLength) {
    const started = _.now()
    const rxBytes = new Uint8Array(rxByteLength)
    let nextBytePos = 0
    function handleExchange() {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('RX timeout'))
        }, 50)
        exchangeRx = (data) => {
          const buffData = Buffer.isBuffer(data) ? new Uint8Array(data) : data
          buffData.forEach((value) => {
            rxBytes[nextBytePos] = value
            nextBytePos += 1
          })
          // console.log('data', data)
          if (nextBytePos > rxByteLength) {
            console.log('too many bytes rx')
            return reject(rxBytes)
          }
          if (nextBytePos === rxByteLength) {
            clearTimeout(timer)
            // console.log('done')
            exchangeRx = _.noop
            return resolve({
              txBytes, rxBytes, started, rtt: _.now() - started, complete: true,
            })
          }
          return null
        }
      })
    }
    // console.log('write', txBytes, rxByteLength)
    return write(txBytes).then(handleExchange)
  }

  return {
    close,
    exchange,
    open,
    write,
    set,
    list: () => SerialPort.list(),
  }
}
