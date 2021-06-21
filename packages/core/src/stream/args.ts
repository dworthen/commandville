import { Transform } from 'stream'

import { toString } from './toString.js'

export function streamArgs(): Transform {
  return process.stdin.pipe(toString())
}
