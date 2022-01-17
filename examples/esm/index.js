import { transform } from '@commandville/transform'

export function greet({ excited, mark = '!', repeat = 1 }) {
  const values = []
  return transform(
    (chunk) => {
      // Check if chunk is a buffer
      const isBuffer = Buffer.isBuffer(chunk)
      console.log(isBuffer)

      // convert chunk to string.
      const value = isBuffer ? chunk.toString('utf-8') : chunk
      values.push(value)
    },
    () => {
      const message = `${values.join(' ').replace(/\r?\n$/, '')}${
        excited ? ''.padEnd(excited, mark) : '.'
      }`
      return ''.padEnd(message.length * repeat, message)
    },
  )
}

function toString() {
  return transform((chunk) => {
    const val = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
    return val.toString().toUpperCase()
  })
}

greet.command = 'greet'
greet.preprocess = toString()
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
