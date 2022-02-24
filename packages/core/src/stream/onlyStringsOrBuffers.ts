import { Transform } from 'stream'

export function onlyStringOrBuffers(): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
      if (Buffer.isBuffer(chunk) || typeof chunk === 'string') {
        this.push(chunk)
      }
      cb()
    },
  })
}
