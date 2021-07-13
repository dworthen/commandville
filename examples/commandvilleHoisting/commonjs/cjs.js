const Transform = require('stream').Transform
const func = require('./cjs2').func
const path = require('path')

const streamCmd = function streamCmd(c) {
  console.log(c.nameOne)
  console.log(c.flagOne)
  console.log(c.last)
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, cb) {
      console.log(Buffer.isBuffer(chunk))
      console.log(chunk.toString('utf-8'))
      this.push(chunk)
      cb()
    },
  })
}

streamCmd.command = 'stream-command'
streamCmd.options = {
  'name-one': {
    description: 'username',
    type: 'string',
  },
  flagOne: {
    description: 'flagOne',
    type: 'string',
  },
  last: {
    description: 'last',
    type: 'string',
  },
}

module.exports.streamCmd = streamCmd
module.exports.testFn = function () {
  console.log('TESTING FROM MODULE!!')
  console.log(path.resolve('../', 'test.js'))
  func()
}
