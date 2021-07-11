import { existsSync, promises as fs } from 'fs'
import glob from 'glob'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

import { Command } from '../command/types.js'
import { program } from './program.js'
import { ProgramDescription } from './types.js'

type Module = Record<string, unknown>

export interface CommandLocation {
  filePathOrGlob: string
  prefix?: string
  cwd?: string
}

export interface ProgramLoader extends Omit<ProgramDescription, 'commands'> {
  commands: Array<CommandLocation | string>
}
export async function load(
  options: ProgramLoader,
): Promise<{ parse: (argv: string[]) => Promise<void> }> {
  const { commands: commandLocationsOrPaths } = options
  const commandModules: Array<Map<string, Command>> = []

  for (const cmdLocationOrString of commandLocationsOrPaths) {
    if (isCommandLocation(cmdLocationOrString)) {
      commandModules.push(await _load(cmdLocationOrString))
    } else {
      commandModules.push(await _load({ filePathOrGlob: cmdLocationOrString }))
    }
  }

  const commands = commandModules.reduce<Map<string, Command>>((acc, cur) => {
    return new Map([...acc, ...cur])
  }, new Map())

  return program({
    ...options,
    commands: [...commands.values()],
  })

  // if (typeof filePathOrCommandLocations === 'string') {
  //   const commands = await _load(filePathOrCommandLocations, options)
  //   return program({
  //     ...options,
  //     commands: [...commands.values()],
  //   })
  // } else {
  //   const commandMaps = await Promise.all(
  //     filePathOrCommandLocations.map(async (commandLocation) => {
  //       // eslint-disable-next-line
  //       return _load(commandLocation)
  //     }),
  //   )
  //   const commands = commandMaps.reduce<Map<string, Command>>((acc, cur) => {
  //     return new Map([...acc, ...cur])
  //   }, new Map())
  //   return program({
  //     ...options,
  //     commands: [...commands.values()],
  //   })
  // }
}

async function _load({
  filePathOrGlob,
  cwd = process.cwd(),
  prefix = '',
}: CommandLocation): Promise<Map<string, Command>> {
  const potentialFile = resolve(cwd, filePathOrGlob)
  const commands: Map<string, Command> = new Map()

  if (await isFile(potentialFile)) {
    await _processModule(potentialFile)
  } else {
    filePathOrGlob = filePathOrGlob.replace(/\\/g, '/')
    if (!glob.hasMagic(filePathOrGlob)) {
      filePathOrGlob = `${filePathOrGlob.replace(/\/$/, '')}/**`
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
    typeof (command as Command).command === 'string'
  )
}

function isCommandLocation(command: unknown): command is CommandLocation {
  return isRecord(command)
}

function isRecord(
  fileOrGlobOrRecord: unknown,
): fileOrGlobOrRecord is Record<string, string> {
  return (
    typeof fileOrGlobOrRecord === 'object' &&
    fileOrGlobOrRecord !== null &&
    fileOrGlobOrRecord.constructor === Object &&
    Object.prototype.toString.call(fileOrGlobOrRecord) === '[object Object]'
  )
}
