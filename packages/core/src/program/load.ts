import { existsSync, promises as fs } from 'fs'
import glob from 'glob'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

import { Command } from '../command/types.js'
import {
  ExpandRecursively,
  isTsEnabled,
  toGlobPattern,
} from '../utils/index.js'
import { program } from './program.js'
import { EnvConfig, ProgramDescription, ProgramParser } from './types.js'

type Module = Record<string, unknown>

export type CommandLocation = {
  filePathOrGlob: string
  prefix?: string
  cwd?: string
}

export type ExtendedEnvConfig = ExpandRecursively<
  EnvConfig & {
    cwd?: string
  }
>

export type ProgramLoader = ExpandRecursively<
  Omit<ProgramDescription, 'commands' | 'env'> & {
    commands: Array<CommandLocation | string>
    env?: ExtendedEnvConfig
  }
>

export async function loadProgram(
  options: ProgramLoader,
): Promise<ProgramParser> {
  const { commands: commandLocationsOrPaths } = options
  const commandModules: Array<Map<string, Command>> = []

  const envConfig = {
    loadEnv: false,
    prefix: 'CLI',
    files: [],
    cwd: process.cwd(),
    ...options.env,
  }

  envConfig.files = await resolveEnvFilePaths(envConfig)

  for (const cmdLocationOrString of commandLocationsOrPaths) {
    if (typeof cmdLocationOrString === 'string') {
      commandModules.push(await _load({ filePathOrGlob: cmdLocationOrString }))
    } else {
      commandModules.push(await _load(cmdLocationOrString))
    }
  }

  const commands = commandModules.reduce<Map<string, Command>>((acc, cur) => {
    return new Map([...acc, ...cur])
  }, new Map())

  return program({
    ...options,
    ...{ env: envConfig },
    commands: [...commands.values()],
  })
}

async function _load(options: CommandLocation): Promise<Map<string, Command>> {
  let { filePathOrGlob, cwd = process.cwd(), prefix = '' } = options
  const potentialFile = resolve(cwd, filePathOrGlob)
  const commands: Map<string, Command> = new Map()

  if (await isFile(potentialFile)) {
    await _processModule(potentialFile)
  } else {
    filePathOrGlob = toGlobPattern(filePathOrGlob)
    if (!glob.hasMagic(filePathOrGlob)) {
      filePathOrGlob = `${filePathOrGlob.replace(/\/$/, '')}/*.{cjs,mjs,js}`
    }

    const files = glob
      .sync(filePathOrGlob, {
        cwd,
        nodir: true,
      })
      .map((filePath) => resolve(cwd, filePath))

    for (const filePath of files) {
      // TODO: Paralize loading modules.
      await _processModule(filePath)
    }
  }

  return commands

  async function _processModule(filePath: string): Promise<void> {
    if (isParsableModule(filePath)) {
      const module: Module = await import(pathToFileURL(filePath).toString())
      _loadCommands({ ...module, ...((module.default ?? {}) as Module) })
    }
  }

  function _loadCommands(module: Module): void {
    Object.entries(module).forEach(([key, value]) => {
      if (isCommand(value)) {
        value.commandName = `${prefix !== '' ? prefix : ''}${value.commandName}`
        commands.set(value.commandName, value)
      }
    })
  }
}

async function isFile(path: string): Promise<boolean> {
  if (existsSync(path)) {
    const stats = await fs.stat(path)
    return stats.isFile()
  }
  return false
}

function isParsableModule(path: string): boolean {
  if (isTsEnabled()) {
    return /\.(?:(?:m|c)?j|t)s$/i.test(path)
  }
  return /\.(?:m|c)?js$/i.test(path)
}

function isCommand(command: unknown): command is Command {
  return (
    typeof command === 'function' &&
    typeof (command as Command).commandName === 'string' &&
    (command as Command).commandName !== ''
  )
}

async function resolveEnvFilePaths(
  envConfig: Required<ExtendedEnvConfig>,
): Promise<string[]> {
  let filePaths: string[] = []

  for (let filePathOrGlob of envConfig.files) {
    if (await isFile(resolve(envConfig.cwd ?? process.cwd(), filePathOrGlob))) {
      filePaths.push(filePathOrGlob)
    } else {
      filePathOrGlob = toGlobPattern(filePathOrGlob)
      if (!glob.hasMagic(filePathOrGlob)) {
        filePathOrGlob = `${filePathOrGlob.replace(/\/$/, '')}/.env`
      }
      const files = glob.sync(filePathOrGlob, {
        cwd: envConfig.cwd ?? process.cwd(),
        nodir: true,
        dot: true,
      })
      filePaths = [...filePaths, ...files]
    }
  }
  return filePaths
}
