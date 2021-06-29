import { Duplex, Transform } from 'stream'

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

function isPromise(arg: any): arg is Promise<unknown> {
  return arg?.then != null && typeof arg.then === 'function'
}
