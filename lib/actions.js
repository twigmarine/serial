import { overEvery, toString } from 'lodash/fp'
import { createSimpleAction, noopAction } from 'cape-redux'

export const SERIAL_LIST = 'serial/SERIAL_LIST'
export const serialList = createSimpleAction(SERIAL_LIST)

export const SERIAL_WRITE = 'serial/SERIAL_WRITE'
export const serialWrite = createSimpleAction(SERIAL_WRITE)

export const SERIAL_EVENT = 'serial/SERIAL_EVENT'

// For use with other reducers and middleware.
export const SERIAL_DATA = 'serial/SERIAL_DATA'
export const serialData = createSimpleAction(SERIAL_DATA)

// Serial port opened.
export const SERIAL_CLOSE = 'serial/SerialClose'
export function serialClose(payload) {
  console.error(`Serial process exited with code ${payload}.`)
  return { type: SERIAL_CLOSE, payload }
}

export const SERIAL_ERROR = 'serial/SerialError'
export const serialErr = overEvery([
  console.error,
  createSimpleAction(SERIAL_ERROR, toString),
])

export const SERIAL_OPEN = 'serial/SerialOpen'
export const serialOpen = createSimpleAction(SERIAL_OPEN)

export const SERIAL_OPENED = 'serial/SERIAL_OPEN'
export const serialOpened = noopAction(SERIAL_OPENED)
