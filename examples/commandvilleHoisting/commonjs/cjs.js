const Transform = require('stream').Transform
const func = require('./cjs2').func
const path = require('path')

const streamCmd = function streamCmd() {
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

module.exports.streamCmd = streamCmd
module.exports.testFn = function () {
  console.log('TESTING FROM MODULE!!')
  console.log(path.resolve('../', 'test.js'))
  func()
}
