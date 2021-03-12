import _ from 'lodash/fp'
import { createReducer } from 'cape-redux'
import { mergeWith } from 'prairie'
import { SERIAL_OPEN, SERIAL_OPENED } from './actions'

const defaultState = {
  baudRate: null,
  search: {},
  isOpening: false,
  isOpen: false,
}

// Keep track of serial ports.
export const reducers = {
  [SERIAL_OPEN]: _.set('isOpening', true),
  [SERIAL_OPENED]: mergeWith({ isOpening: false, isOpen: true }),
}
export default createReducer(reducers, defaultState)
