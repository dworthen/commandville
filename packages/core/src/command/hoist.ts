import intoStream from 'into-stream'
import multipipe from 'multipipe'
import MultiStream from 'multistream'
import { PassThrough /* pipeline as pl */ } from 'stream'

// import { debug } from '../stream/debug.js'
import { parseJson, toString } from '../stream/index.js'
import { onlyStringOrBuffers } from '../stream/onlyStringsOrBuffers.js'
import { stripNewline } from '../stream/stripNewline.js'
// import util from 'util'
// import { streamArgs } from '../stream/args.js'
import { isPromise, isStdinPiped, loadArgs } from '../utils/index.js'
import type {
  CliPositionalArgumentAsyncParser,
  CliPositionalArgumentSyncParser,
  CliPostionalArgumentParser,
  Command,
} from './types.js'

type CliHandler = (args: Record<string, unknown>) => Promise<void>

// const pipeline = util.promisify(pl)
const defaultPreprocessPipeline = multipipe(toString(), parseJson())
const defaultPostProcessPipeline = toString()

export default function hoist(command: Command): CliHandler {
  return async (args: Record<string, unknown>) => {
    const cliArgs = args._ as string[]
    const streamOrFunction = command(args)
    if (cliArgs[0] === command.commandName) {
      cliArgs.shift()
    }
    if (isFunction(streamOrFunction)) {
      if (isStdinPiped()) {
        const streamedArgs = await loadArgs()
        cliArgs.push(...streamedArgs)
      }
      const resultOrPromise = streamOrFunction(cliArgs)
      if (isPromise(resultOrPromise)) {
        const results = await resultOrPromise
        if (results != null) {
          console.log(results)
        }
      } else {
        if (resultOrPromise != null) {
          console.log(resultOrPromise)
        }
      }
    } else {
      // pipeline API only supported node ^15 due to
      // https://github.com/nodejs/node/issues/34274
      // Hold out on using pipeline API until better supported.
      // await pipeline(
      //   [
      //     new MultiStream(
      //       [intoStream(cliArgs), isStdinPiped() ? process.stdin : null].filter(
      //         (s) => s !== null,
      //       ),
      //     ),
      //     command.preprocess ?? null,
      //     streamOrFunction,
      //     command.postprocess ?? null,
      //     process.stdout,
      //   ].filter((s) => s !== null),
      // )
      const promise = new Promise<void>((resolve, reject) => {
        const stream = MultiStream.obj(
          [intoStream(cliArgs), isStdinPiped() ? process.stdin : null].filter(
            (s) => s !== null,
          ),
        )
          // const stream = process.stdin
          .pipe(
            command.disablePreprocess !== false
              ? command.preprocess ?? defaultPreprocessPipeline
              : new PassThrough(),
          )
          .pipe(stripNewline())
          // .pipe(debug(true))
          .pipe(streamOrFunction)
          .pipe(
            command.disablePostprocess !== false
              ? command.postprocess ?? defaultPostProcessPipeline
              : new PassThrough(),
          )
          .pipe(onlyStringOrBuffers())
          .pipe(process.stdout)
        stream.on('finish', resolve)
        stream.on('error', reject)
      })
      await promise
    }
  }
}

function isFunction(
  arg: CliPostionalArgumentParser,
): arg is CliPositionalArgumentSyncParser | CliPositionalArgumentAsyncParser {
  return typeof arg === 'function'
}
