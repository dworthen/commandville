import { Transform } from 'stream'

import { map } from './map.js'

export function stripNewline(): Transform {
  return map((chunk: string) => {
    return chunk.replace(/\r?\n$/, '')
    // return Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
  })
}
