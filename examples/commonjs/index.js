const { Transform } = require('stream')
const fs = require('fs')

function greet({ excited, mark = '!', repeat = 1, configFile }) {
  let values = []
  return new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
      // Check if chunk is a buffer
      const isBuffer = Buffer.isBuffer(chunk)

      // convert chunk to string.
      const value = isBuffer ? chunk.toString('utf-8') : chunk
      values.push(value)
      cb()
    },
    flush(cb) {
      const message = `${values.join(' ').replace(/\r?\n$/, '')}${
        excited ? ''.padEnd(excited, mark) : '.'
      }`
      this.push(''.padEnd(message.length * repeat, message))
      cb()
    },
  })
}

greet.command = 'greet'

greet.options = {
  excited: {
    type: 'count',
    description: 'Is it an exciting message.',
    aliases: ['e'],
  },
  mark: {
    type: 'string',
    description: 'Punctuation mark to use for exciting messages.',
    default: '!',
  },
  repeat: {
    type: 'number',
    description: 'Repeat the message x number of times.',
    default: 1,
    coerce: (val) => {
      if (val < 0) {
        throw new Error('Cannot repeat a message a negative number of times')
      }
      return val | 0
    },
  },
  'config-file': {
    type: 'string',
    description: 'Specify a config file',
    config: true,
    // configParser: (filePath) => {
    //   // return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    //   console.log(filePath)
    //   return filePath
    // },
  },
}

module.exports = greet
