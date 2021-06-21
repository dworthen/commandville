import { Transform } from 'stream'

export function map(map: (chunk: any) => any): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
      this.push(map(chunk))
      cb()
    },
  })
}
