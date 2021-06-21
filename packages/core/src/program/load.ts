#!/usr/bin/env node

import { existsSync, promises as fs } from 'fs'
import glob from 'glob'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

import { Command } from '../command/types.js'
import { ProgramDescription } from './types.js'

let commands: Map<string, Command<any>> = new Map()

export async function load(
  fileOrGlobOrRecord: string | Record<string, string>,
  options: Omit<ProgramDescription, 'commands'> & { cwd?: string } = {
    program: '',
  },
): Promise<void> /* { parse: (argv: string[]) => Promise<void> } */ {
  commands = new Map<string, Command<any>>()

  if (isRecord(fileOrGlobOrRecord)) {
    await Promise.all(
      Object.entries(fileOrGlobOrRecord).map(async ([key, value]) => {
        // eslint-disable-next-line
        return _load(value, {
          ...options,
          prefix: key,
        })
      }),
    )
  } else {
    await _load(fileOrGlobOrRecord, options)
  }

  commands.forEach((c) => {
    console.log(c.command)
  })
}

async function _load(
  globOrFilePath: string,
  options?: Omit<ProgramDescription, 'commands'> & {
    cwd?: string
    prefix?: string
  },
): Promise<void> {
  console.log(globOrFilePath)
  const { cwd = process.cwd(), prefix = '' } = options ?? {}
  const potentialFile = resolve(cwd, globOrFilePath)

  if (await isFile(potentialFile)) {
    await _processModule(potentialFile)
  } else {
    globOrFilePath = globOrFilePath.replace(/\\/g, '/')
    if (!glob.hasMagic(globOrFilePath)) {
      globOrFilePath = `${globOrFilePath.replace(/\/$/, '')}/**`
    }

    const files = glob.sync(globOrFilePath, {
      cwd,
      nodir: true,
    })

    console.log(files)

    for (const filePath of files) {
      await _processModule(filePath)
    }
  }

  async function _processModule(filePath: string): Promise<void> {
    await loadModule(filePath, prefix)
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

type Module = Record<string, unknown>

async function loadModule(filePath: string, prefix: string): Promise<void> {
  if (isJsOrTs(filePath)) {
    const module: Module = await import(pathToFileURL(filePath).toString())
    loadCommands({ ...module, ...((module.default ?? {}) as Module) }, prefix)
  }
}

function loadCommands(module: Module, prefix: string): void {
  Object.entries(module).forEach(([key, value]) => {
    if (isCommand(value)) {
      value.command = `${prefix !== '' ? prefix + ':' : ''}${value.command}`
      commands.set(value.command, value)
    }
  })
}

function isCommand(command: unknown): command is Command<any> {
  return (
    typeof command === 'function' &&
    typeof (command as Command<any>).command === 'string' &&
    typeof (command as Command<any>).description === 'string'
  )
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

load(process.argv[2]).catch((ex) => {
  console.log(ex)
})
