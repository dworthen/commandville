import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { existsSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import yargs from 'yargs'

import hoist from '../command/hoist.js'
import toYargsOptions from '../command/toYargOptions.js'
import type { Command, CommandOptions } from '../command/types'
import { nu } from '../utils/index.js'
import type { ProgramDescription, ProgramParser } from './types'

// eslint-disable-next-line
const __dirname = dirname(fileURLToPath(import.meta.url))

export function program(programDescription: ProgramDescription): ProgramParser {
  const {
    program,
    commands,
    version = '0',
    config,
    loadEnv = false,
    envPrefix = 'CMV',
    envFile = '.env',
  } = programDescription

  let prog = yargs([]).scriptName(program)

  if (version != null) _setVersion()
  if (loadEnv) _loadEnv()
  if (config != null) _setConfig()
  prog = prog.showHelpOnFail(true)

  commands.forEach(_loadCommand)

  function _setVersion(): void {
    prog = prog.version(version)
  }

  function _loadEnv(): void {
    if (envFile != null && existsSync(envFile)) {
      const env = dotenv.config({
        path: envFile,
      })
      dotenvExpand(env)
    }
    prog = prog.env(envPrefix ?? '')
  }

  function _setConfig(): void {
    prog = prog.config(config as Record<string, unknown>)
  }

  function _loadCommand(cmd: Command): void {
    const { command, aliases, description = '', deprecated, options } = cmd

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
