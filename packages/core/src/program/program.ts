import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync } from 'fs'
// import multipipe from 'multipipe'
import { dirname, resolve } from 'path'
// import { Transform } from 'stream'
import { fileURLToPath } from 'url'
import yargs from 'yargs'

import hoist from '../command/hoist.js'
import toYargsOptions from '../command/toYargOptions.js'
import type {
  // AsyncParser,
  CliParser,
  Command,
  CommandOptions,
  // StreamParser,
} from '../command/types'
import { nu /* transform */ } from '../utils/index.js'
import type { ProgramDescription, ProgramParser } from './types'

// eslint-disable-next-line
const __dirname = dirname(fileURLToPath(import.meta.url))

export function program({
  program,
  commands,
  version,
  config,
  loadEnv = false,
  envPrefix = 'CLI',
  envFile,
}: ProgramDescription): ProgramParser {
  const cwd = process.cwd()
  // console.log(cwd)
  // console.log(resolve(cwd, '../../test'))

  let prog = yargs([]).scriptName(program)

  if (version != null) _setVersion()
  if (loadEnv) _loadEnv()
  if (config != null) _loadConfig()
  prog = prog.showHelpOnFail(false)

  commands.forEach(_loadCommand)

  function _setVersion(): void {
    prog = prog.version(version as string)
  }

  function _loadEnv(): void {
    const envFilePath = envFile != null ? resolve(cwd, envFile) : null
    if (envFilePath != null && existsSync(envFilePath)) {
      const env = dotenv.config({
        path: envFilePath,
      })
      dotenvExpand(env)
    }
    prog = prog.env(envPrefix ?? '')
  }

  function _loadConfig(): void {
    prog = prog.config(config as Record<string, unknown>)
  }

  function _loadCommand(cmd: Command<CliParser>): void {
    const { command, aliases, description, deprecated, options } = cmd

    prog = prog.command({
      command,
      ...(nu(aliases) && { aliases }),
      ...(nu(description) && { describe: description }),
      ...(nu(deprecated) && { deprecated }),
      ...(nu(options) && {
        builder: toYargsOptions(options as CommandOptions),
      }),
      handler: hoist(cmd),
    })
  }

  return {
    async parse(argv: string[]): Promise<void> {
      prog.parse(argv)
    },
  }
}

// export default program

// interface CMDOptions {
//   [key: string]: unknown
//   name: string
// }

// const cmd: Command<AsyncParser> = function cmd() {
//   return async (args) => {
//     console.log(`Args: ${args.join(', ')}`)
//     console.log('RUNNING COMMAND')
//     return 'Cool beans'
//   }
// }

// cmd.command = 'serve'
// // cmd.aliases = ['$0']
// cmd.description = 'start the server'
// cmd.options = {
//   option: {
//     aliases: ['o', 'opt'],
//     type: 'string',
//     default: 'AWESOME',
//     description: 'Set some option',
//     coerce: (o) => {
//       // console.log(o)
//       return o
//     },
//   },
//   load: {
//     type: 'string',
//     description: 'load config',
//     config: true,
//     configParser: (p) => {
//       console.log(`path: ${p}`)
//       return {
//         o: 'LOADED CONFIG',
//       }
//     },
//     coerce: (o) => {
//       // console.log(o)
//       return o
//     },
//   },
// }

// const streamCmd1: Command<StreamParser> = function streamCmd1() {
//   return new Transform({
//     objectMode: true,
//     // encoding: 'utf-8',
//     // readableObjectMode: true,
//     // writableObjectMode: true,
//     transform(chunk, encoding, cb) {
//       console.log(`streamCmd1`)
//       console.log(`encoding: ${encoding}`)
//       console.log(`buffer: ${Buffer.isBuffer(chunk).toString()}`)
//       console.log(chunk)
//       console.log(chunk.toString('utf8'))
//       this.push({ name: 'cool' })
//       cb()
//     },
//   })
// }
// streamCmd1.command = 'stream-command'
// streamCmd1.description = 'Cool description'

// const streamCmd2: Command<StreamParser> = function streamCmd2() {
//   return new Transform({
//     objectMode: true,
//     // encoding: 'utf-8',
//     // readableObjectMode: true,
//     // readableObjectMode: true,
//     transform(chunk, encoding, cb) {
//       console.log(`streamCmd2`)
//       throw new Error('Testing error!')
//       // console.log(`encoding: ${encoding}`)
//       // console.log(`buffer: ${Buffer.isBuffer(chunk).toString()}`)
//       // console.log(chunk)
//       // console.log(chunk.toString('utf8'))
//       // this.push('cmd2')
//       // cb()
//     },
//   })
// }

// streamCmd2.command = 'stream-command'
// streamCmd2.description = 'Cool description'

// const streamCmd3: Command<StreamParser> = function streamCmd3() {
//   return new Transform({
//     // objectMode: true,
//     // encoding: 'utf-8',
//     // readableObjectMode: true,
//     // readableObjectMode: true,
//     transform(chunk, encoding, cb) {
//       console.log(`streamCmd3`)
//       console.log(`encoding: ${encoding}`)
//       console.log(`buffer: ${Buffer.isBuffer(chunk).toString()}`)
//       console.log(chunk)
//       console.log(chunk.toString('utf8'))
//       this.push({ name: 'cool' })
//       cb()
//     },
//   })
// }

// streamCmd3.command = 'stream-command'
// streamCmd3.description = 'Cool description'

// const streamCmd: Command<StreamParser> = function streamCmd() {
//   // return multipipe(streamCmd1(), streamCmd2(), streamCmd3())
//   return transform<string, string, number>(
//     (chunk) => {
//       console.log(Buffer.isBuffer(chunk))
//       console.log(chunk)
//       return chunk
//     },
//     // () => {
//     //   // throw new Error('TESTING')
//     //   console.log('Flushing!')
//     //   return 5
//     // },
//   )
// }

// streamCmd.command = 'stream-command'
// streamCmd.description = 'Cool description'
// streamCmd.preprocess = transform((chunk) => {
//   return Buffer.isBuffer(chunk)
//     ? chunk.toString('utf-8').replace(/\n|\r\n/g, '')
//     : chunk
// })

// streamCmd.postprocess = transform()

// const mod = await import('./test.js') // eslint-disable-line
// console.log(mod)

// program({
//   program: 'My Program',
//   commands: [cmd, streamCmd],
//   version: '10',
//   loadEnv: false,
//   envPrefix: 'CLI',
//   envFile: resolve(__dirname, '../cli.env'),
// })
//   // .parse(['serve', 'Derek'])
//   .parse(process.argv.slice(2))
//   .catch((ex) => {
//     console.log('Error')
//   })
