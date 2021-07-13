/**
 * A utility library for creating
 * {@link https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_simplified_construction | NodeJS streams}
 *
 * @packageDocumentation
 */

import { Duplex, Transform } from 'stream'

/**
 * @public
 */
export type ChunkTransformer<T = unknown, R = unknown> = (
  chunk: T,
) => R | Promise<R>

/**
 * @public
 */
export type Flusher<R = unknown> = () => R | Promise<R>

/**
 * An alternative, simplified construction for creating
 * {@link https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_duplex_and_transform_streams | Transform streams}
 * May also use NodeJS
 * {@link https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_simplified_construction | simplified construction}
 *
 * @example
 * ```
 * import { transform } from '@commandville/transform'
 * import { pipeline as pl } from 'stream'
 * import { promisify } from 'util'
 *
 * const pipeline = util.promisify(pl)
 *
 * const toStringTransform = transform((chunk) => {
 *   return Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk
 * }, () => {
 *   console.log('FINISHED');
 * })
 *
 * await pipeline([
 *   process.stdin,
 *   toStringTransform,
 *   process.stdout
 * ])
 * ```
 *
 * @param transformer - A function for transforming a stream chunk. May be async.
 * @param flusher -
 * @returns A {@link https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_duplex_and_transform_streams | Duplex stream}
 *
 * @public
 */
export function transform<T = unknown, R1 = unknown, R2 = unknown>(
  transformer?: ChunkTransformer<T, R1>,
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
