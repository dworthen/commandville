const { Transform } = require('stream')
const fs = require('fs')

const cmd = (options) => {
  console.log(options)
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, cb) {
      // Check if chunk is a buffer
      const isBuffer = Buffer.isBuffer(chunk)

      // convert chunk to string.
      const value = isBuffer ? chunk.toString('utf-8') : chunk

      console.log(`${value} is a buffer: ${isBuffer}`)

      // push the value to the next stream.
      this.push(value)
      cb()
    },
  })
}

cmd.command = 'greeting'

cmd.options = {
  optionOne: {
    description: 'Option One',
    type: 'string',
    coerce: (filePath) => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`${filePath} does not exist.`)
      }
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    },
  },
  'option-two': {
    description: 'more options',
    type: 'number',
  },
  'nested.option': {
    description: 'nested option',
    type: 'string',
  },
}

module.exports = cmd
