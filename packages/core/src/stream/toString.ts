import { Transform } from 'stream'

import { map } from './map.js'

export function toString(): Transform {
  return map((chunk) => {
    return Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
  })
}
