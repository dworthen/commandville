const { Transform } = require('stream')
const fs = require('fs')

const greetCommand = function greet({ excited, mark = '!', repeat = 1 }) {
  return function parse([greeting, name]) {
    const message = `${greeting}, ${name}${
      excited ? ''.padEnd(excited, mark) : '.'
    }`
    return ''.padEnd(message.length * repeat, message)
  }
}

greetCommand.command = 'greeting'

greetCommand.options = {
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

module.exports = greetCommand
