import { existsSync, promises as fs } from 'fs'
import glob from 'glob'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

import { Command } from '../command/types.js'
import { program } from './program.js'
import { ProgramDescription } from './types.js'

type Module = Record<string, unknown>

export interface CommandLocation {
  path: string
  prefix?: string
  cwd?: string
}
export async function load(
  filePathOrCommandLocations: string | CommandLocation[],
  options: Omit<ProgramDescription, 'commands'> = {
    program: '',
  },
): Promise<{ parse: (argv: string[]) => Promise<void> }> {
  if (typeof filePathOrCommandLocations === 'string') {
    const commands = await _load(filePathOrCommandLocations, options)
    return program({
      ...options,
      commands: [...commands.values()],
    })
  } else {
    const commandMaps = await Promise.all(
      filePathOrCommandLocations.map(async (commandLocation) => {
        // eslint-disable-next-line
        return _load(commandLocation.path, {
          ...options,
          ...commandLocation,
        })
      }),
    )
    const commands = commandMaps.reduce<Map<string, Command>>((acc, cur) => {
      return new Map([...acc, ...cur])
    }, new Map())
    return program({
      ...options,
      commands: [...commands.values()],
    })
  }

  // if (isRecord(filePathOrCommandLocations)) {
  //   const commandMaps = await Promise.all(
  //     Object.entries(filePathOrCommandLocations).map(async ([key, value]) => {
  //       // if(isCommandArray(value)) {
  //       //   return new Map<string, Command>((value.map(cmd => [`${key}:${cmd.command}`, cmd])))`
  //       // } else {
  //         // eslint-disable-next-line
  //         return _load(value, {
  //           ...options,
  //           prefix: key,
  //         })
  //       // }
  //     }),
  //   )
  //   const commands = commandMaps.reduce<Map<string, Command>>((acc, cur) => {
  //     return new Map([...acc, ...cur])
  //   }, new Map())
  //   return program({
  //     ...options,
  //     commands: [...commands.values()],
  //   })
  // } else {
  //   const commands = await _load(filePathOrCommandLocations, options)
  //   return program({
  //     ...options,
  //     commands: [...commands.values()],
  //   })
  // }
}

async function _load(
  globOrFilePath: string,
  options: Omit<ProgramDescription, 'commands'> & {
    cwd?: string
    prefix?: string
  },
): Promise<Map<string, Command>> {
  const { cwd = process.cwd(), prefix = '' } = options
  const potentialFile = resolve(cwd, globOrFilePath)
  const commands: Map<string, Command> = new Map()

  if (await isFile(potentialFile)) {
    await _processModule(potentialFile)
  } else {
    globOrFilePath = globOrFilePath.replace(/\\/g, '/')
    if (!glob.hasMagic(globOrFilePath)) {
      globOrFilePath = `${globOrFilePath.replace(/\/$/, '')}/**`
    }

    const files = glob
      .sync(globOrFilePath, {
        cwd,
        nodir: true,
      })
      .map((filePath) => resolve(cwd, filePath))

    for (const filePath of files) {
      await _processModule(filePath)
    }
  }

  return commands

  async function _processModule(filePath: string): Promise<void> {
    if (isJsOrTs(filePath)) {
      const module: Module = await import(pathToFileURL(filePath).toString())
      _loadCommands({ ...module, ...((module.default ?? {}) as Module) })
    }
  }
  function _loadCommands(module: Module): void {
    Object.entries(module).forEach(([key, value]) => {
      if (isCommand(value)) {
        value.command = `${prefix !== '' ? prefix + ':' : ''}${value.command}`
        commands.set(value.command, value)
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

function isJsOrTs(path: string): boolean {
  return /\.(?:m?j|t)s$/.test(path)
}

function isCommand(command: unknown): command is Command {
  return (
    typeof command === 'function' &&
    typeof (command as Command).command === 'string' &&
    typeof (command as Command).description === 'string'
  )
}

// function isRecord(
//   fileOrGlobOrRecord: unknown,
// ): fileOrGlobOrRecord is Record<string, string> {
//   return (
//     typeof fileOrGlobOrRecord === 'object' &&
//     fileOrGlobOrRecord !== null &&
//     fileOrGlobOrRecord.constructor === Object &&
//     Object.prototype.toString.call(fileOrGlobOrRecord) === '[object Object]'
//   )
// }
