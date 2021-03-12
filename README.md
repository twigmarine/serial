# Tools for USB Serial Ports

Uses rxjs and serialport.

## findPort(searchObj)

## createPort(path, options)

```javascript
const getUsbFeed = (search, options) => findPort(search).pipe(
  concatMap((portInfo) => {
    const {
      open, onMessage, write,
    } = createPort(portInfo.path, options)
    return concat(
      of({ payload: portInfo, type: 'SERIAL_PORT:FOUND' }),
      open().pipe(delay(100)),
      merge(
        concat(
          write('S5\r'),
          write('O\r'),
        ),
        onMessage,
      ),
    )
  }),
)
function startFeed() {
  const search = { path: '/dev/tty.usbmodem14201' }
  const options = {
    baudRate: 115200, dataBits: 8, parity: 'none', stopBits: 1,
  }
  const feed = getUsbFeed(search, options)
}
```
