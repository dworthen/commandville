import { fstatSync } from 'fs'
import { Duplex, Transform } from 'stream'

import { AsyncParser } from '../command/types.js'
import { streamArgs } from '../stream/index.js'

export function nu(arg: any): boolean {
  return arg !== undefined
}

export function isStdinPiped(): boolean {
  try {
    const stats = fstatSync(0)
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

export type Transformer<T = unknown, R = unknown> = (chunk: T) => R | Promise<R>
export type Flusher<R = unknown> = () => R | Promise<R>

export function transform<T = unknown, R1 = unknown, R2 = unknown>(
  transformer?: Transformer<T, R1>,
  flusher?: Flusher<R2>,
): Duplex {
  return new Transform({
    objectMode: true,
    async transform(chunk, enc, cb) {
      if (transformer == null) {
        cb()
        return
      }
      try {
        const resultOrPromise = transformer(chunk)
        if (isPromise(resultOrPromise)) {
          const result = await resultOrPromise
          this.push(result)
        } else {
          this.push(resultOrPromise)
        }
        cb()
      } catch (ex) {
        cb(ex)
      }
    },
    async flush(cb) {
      if (flusher == null) {
        cb()
        return
      }
      try {
        const resultOrPromise = flusher()
        if (isPromise(resultOrPromise)) {
          const result = await resultOrPromise
          result != null && this.push(result)
        } else {
          resultOrPromise != null && this.push(resultOrPromise)
        }
        cb()
      } catch (ex) {
        cb(ex)
      }
    },
  })
}
