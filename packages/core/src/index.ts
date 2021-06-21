#!/usr/bin/env node

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { resolve } from 'path'
import yargs from 'yargs'

const env = dotenv.config({
  path: resolve(__dirname, 'cli.env'),
})
dotenvExpand(env)

let commands = yargs.scriptName('My-Script')

commands = commands.version('0.0.1-alpha.0')

commands = commands.env('CLI')
commands = commands.command({
  command: 'serve',
  // aliases: ['$0', 's'],
  // describe: 'Serve',
  builder: {
    option: {
      alias: ['o', 'p'],
      type: 'number',
      array: true,
    },
  },
  handler: (argv) => {
    console.log(argv)
  },
})
// .command(
//   'serve2 [port]',
//   'start the server',
//   (yargs) => {
//     return yargs.positional('port2', {
//       describe: 'port to bind on',
//       default: 5000,
//       coerce: () => {
//         throw new Error('Invalid port. Try again')
//       },
//     })
//   },
//   (argv) => {
//     if (argv.verbose) console.info(`start server on :${argv.port}`)
//     // serve(argv.port)
//   },
// )
// .example('serve2', 'cool beans')
// .option('verbose', {
//   alias: 'v',
//   type: 'boolean',
//   description: 'Run with verbose logging',
// })
// .showHelpOnFail(false)

commands.parse(['--help'])
