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

export function stringifyJson(): Transform {
  return map((chunk) => {
    try {
      if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string') {
        return JSON.stringify(chunk)
      } else {
        return chunk
      }
    } catch (ex) {
      return chunk
    }
  })
}
