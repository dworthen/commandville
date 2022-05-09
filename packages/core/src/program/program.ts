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

export function program(programDescription: ProgramDescription): ProgramParser {
  const {
    program,
    commands,
    defaultCommand = '',
    helpFlag: help,
    description,
    version = '0',
    config,
    noUnknownOptions = false,
    showHelpOnFailure = false,
  } = programDescription

  const envConfig = {
    loadEnv: false,
    prefix: 'CLI',
    files: [],
    ...programDescription.env,
  }

  let prog = yargs([]).scriptName(program)

  if (version != null) _setVersion()
  if (envConfig.loadEnv) _loadEnv()
  if (config != null) _setConfig()
  if (noUnknownOptions) prog.strictOptions(true)

  prog = prog.showHelpOnFail(showHelpOnFailure)

  commands.forEach(_loadCommand)

  function _setVersion(): void {
    prog = prog.version(version)
  }

  function _loadEnv(): void {
    if (Array.isArray(envConfig.files) && envConfig.files.length > 0) {
      let env: dotenv.DotenvConfigOutput | null = null
      for (const filePath of envConfig.files) {
        if (existsSync(filePath)) {
          env = dotenv.config({
            path: filePath,
          })
          dotenvExpand(env)
        }
      }
    }
    // if (envFile != null && envFile !== '' && existsSync(envFile)) {
    //   const env = dotenv.config({
    //     path: envFile,
    //   })
    //   dotenvExpand(env)
    // }
    prog = prog.env(envConfig.prefix ?? '')
  }

  function _setConfig(): void {
    prog = prog.config(config as Record<string, unknown>)
  }

  function _loadCommand(cmd: Command): void {
    const {
      commandName: command,
      aliases,
      description = '',
      deprecated,
      options,
    } = cmd

    prog = prog.command({
      command: command === defaultCommand ? [command, '$0'] : command,
      describe: description,
      ...(nu(aliases) && { aliases }),
      ...(nu(deprecated) && { deprecated }),
      ...(nu(options) && {
        builder: toYargsOptions(options as CommandOptions),
      }),
      handler: hoist(cmd),
    })
  }

  prog.demandCommand()
  // prog.usage(description!)
  prog.help(help ?? 'help', description)

  return {
    async parse(argv: string[]): Promise<void> {
      await prog.parseAsync(argv)
    },
  }
}
