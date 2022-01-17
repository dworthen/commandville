import { fstatSync } from 'fs'
import { Transform } from 'stream'

import { AsyncParser } from '../command/types.js'
import { streamArgs } from '../stream/index.js'

export function nu(arg: any): boolean {
  return arg !== undefined
}

export function isStdinPiped(): boolean {
  try {
    const stats = fstatSync(process.stdin.fd)
    return !stats.isFIFO()
  } catch (ex) {
    return false
  }
}

export function isPromise(arg: any): arg is AsyncParser {
  return arg?.then != null && typeof arg.then === 'function'
}

export async function loadArgs(): Promise<string[]> {
  const promise = new Promise<string[]>((resolve, reject) => {
    const args: string[] = []
    const stream = streamArgs().pipe(
      new Transform({
        objectMode: true,
        transform(chunk, enc, cb) {
          args.push(chunk)
          cb()
        },
      }),
    )
    stream.on('finish', () => resolve(args))
    stream.on('error', reject)
  })

  return await promise
}
