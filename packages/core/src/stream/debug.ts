import { Transform } from 'stream'

export function debug(enabled: boolean = false): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
      if (enabled) console.log(`DEBUG: ${chunk as string}`)
      this.push(chunk)
      cb()
    },
  })
}
