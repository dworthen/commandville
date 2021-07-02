import { Transform } from 'stream'

import { func } from './esm2.mjs'

import { resolve } from 'path'

export const streamCmd = function streamCmd() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, cb) {
      console.log(chunk)
      this.push(chunk)
      cb()
    },
  })
}

streamCmd.command = 'stream-command'
streamCmd.description = 'Cool description'

export function testFn() {
  console.log('FROM AN ESM')
  console.log(resolve('../', 'test.js'))
  func()
}
