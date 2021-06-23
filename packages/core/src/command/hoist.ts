import intoStream from 'into-stream'
import MultiStream from 'multistream'
import { PassThrough, pipeline as pl } from 'stream'
import util from 'util'

import { isPromise, isStdinPiped, loadArgs } from '../utils/index.js'
import type {
  AsyncParser,
  CliHandler,
  CliParser,
  Command,
  Parser,
} from './types'

const pipeline = util.promisify(pl)
export default function hoist(command: Command): CliHandler {
  return async (args: Record<string, unknown>) => {
    const cliArgs = args._ as string[]
    const streamOrFunction = command(args)
    if (cliArgs[0] === command.command) {
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
      await pipeline(
        [
          new MultiStream([
            intoStream(cliArgs),
            isStdinPiped() ? process.stdin : new PassThrough(),
          ]),
          command.preprocess ?? null,
          streamOrFunction,
          command.postprocess ?? null,
          process.stdout,
        ].filter((v) => v != null),
      )
    }
  }
}

function isFunction(arg: CliParser): arg is Parser | AsyncParser {
  return typeof arg === 'function'
}
