import SerialPort from 'serialport'
import {
  parserClose, parserErr, parserOpen,
  serialClose, serialData, serialErr, serialOpen,
} from './actions'

export default function initSerial(dispatcher, options) {
  const { baudRate, devicePath } = options
  console.log('init Serial', devicePath, baudRate)
  const handleError = dispatcher(serialErr)
  const handleClose = dispatcher(serialClose)
  const handleOpen = dispatcher(serialOpen)

  let serial = null
  let parser = null

  function cleanup() {
    if (serial === null) return
    serial.unpipe(parser)
    parser.removeAllListeners()
    parser = null
    serial.removeAllListeners()
    serial = null
    console.log('serial cleared', devicePath)
  }
  function start() {
    cleanup()
    serial = new SerialPort(devicePath, {
      baudRate,
    })
    function onClose(err) {
      handleClose(err)
      SerialPort.list()
      .then(console.log)
      .then(start)
    }
    function onOpen() {
      parser = new SerialPort.parsers.Readline()
      parser.on('open', dispatcher(parserOpen))
      parser.on('error', dispatcher(parserErr))
      parser.on('close', dispatcher(parserClose))
      parser.on('data', dispatcher(serialData))
      serial.pipe(parser)
      handleOpen()
    }
    serial.on('error', handleError)
    serial.on('close', onClose)
    serial.on('open', onOpen)
  }
  start()
  // console.log('Serial is open?', serial.isOpen)
}
