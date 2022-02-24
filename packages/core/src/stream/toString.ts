import { Transform } from 'stream'

import { map } from './map.js'

export function toString(): Transform {
  return map((chunk) => {
    if (Buffer.isBuffer(chunk)) {
      return chunk.toString('utf8')
    } else if (typeof chunk !== 'string') {
      try {
        return JSON.stringify(chunk)
      } catch (ex) {
        return chunk.toString()
      }
    }
    return chunk
    // return Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
  })
}
