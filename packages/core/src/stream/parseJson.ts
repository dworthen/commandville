import { Transform } from 'stream'

import { map } from './map.js'

export function parseJson(): Transform {
  return map((chunk) => {
    try {
      return JSON.parse(chunk)
    } catch (ex) {
      return chunk
    }
  })
}
