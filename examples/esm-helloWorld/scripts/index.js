// index.mjs

// Outer function recieves named flags.
export function greet(opts) {
  console.dir(opts, { depth: null })

  // Inner closure recieves positional CLI arguments
  return function cli(...args) {
    return args
  }
}

/**
 * Define the CLI command name
 * .command informs Commandville that this is a
 * function that should be hoisted as a CLI command.
 **/
greet.commandName = 'greet'

// Define command flags and options
// printed when using cmv <COMMAND> --help
greet.options = {
  greeting: {
    type: 'string',
    aliases: ['g'],
    description: 'Specify greeting to use.',
  },
  dbPassword: {
    type: 'string',
    description: 'two',
    aliases: ['p'],
  },
  parse: {
    type: 'boolean',
    description: 'parse?',
  },
  'config-file': {
    type: 'string',
    aliases: ['c'],
    description: 'load options from a config file.',
    config: true,
  },
}
