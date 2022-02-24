import { CliPositionalArgumentStreamParser, Command } from '@commandville/core'
import { transform } from '@commandville/transform'
import { Dirent, promises as fs } from 'fs'
import isGlob from 'is-glob'
import micromatch from 'micromatch'
import { relative, resolve } from 'path'
import type { Transform } from 'stream'

export type ListFilesOptions = {
  cwd?: string
  includeDirectories?: boolean
  // traversalOrder?: 'bf' | 'df'
  absolutePaths?: boolean
  matchingCriteria?: 'all' | 'any'
  newline?: boolean
}

export const listFiles: Command<
  ListFilesOptions,
  CliPositionalArgumentStreamParser
> = function listFiles(options) {
  const {
    cwd = process.cwd(),
    includeDirectories = false,
    // traversalOrder = 'bf',
    absolutePaths = false,
    matchingCriteria = 'all',
    newline = false,
  } = options
  const globs: string[] = []

  const matchingFunction: 'isMatch' | 'all' =
    matchingCriteria === 'any' ? 'isMatch' : 'all'

  return transform(
    (chunk: string) => {
      globs.push(isGlob(chunk) ? chunk : `${chunk.replace(/\/$/, '')}/*`)
    },
    async function flush(this: Transform) {
      const root = resolve(process.cwd(), cwd) // .replace(/\\/g, '/')

      let stack: Dirent[] = await readDir(root)

      while (stack.length > 0) {
        const current = stack.shift()!
        const relPath = relative(root, current.name)
        if (current?.isDirectory()) {
          stack = [...(await readDir(current.name)), ...stack]
          if (
            includeDirectories &&
            micromatch[matchingFunction](relPath, globs, { cwd: root })
          ) {
            this.push(
              `${!absolutePaths ? relPath : current.name}${
                newline ? '\n' : ''
              }`,
            )
          }
        } else if (
          current.isFile() &&
          micromatch[matchingFunction](relPath, globs, { cwd: root })
        ) {
          await new Promise<void>((resolve, reject) => {
            setTimeout(() => {
              this.push(
                `${!absolutePaths ? relPath : current.name}${
                  newline ? '\n' : ''
                }`,
              )
              resolve()
            }, 1000)
          })
        }
      }
    },
  )
}

async function readDir(dirPath: string): Promise<Dirent[]> {
  return (await fs.readdir(dirPath, { withFileTypes: true })).map((file) => {
    file.name = resolve(dirPath, file.name)
    return file
  })
}

listFiles.commandName = '$0'
listFiles.options = {
  cwd: {
    type: 'string',
    description: 'Specify CWD to list files.',
    default: process.cwd(),
  },
  'include-directories': {
    type: 'boolean',
    aliases: ['d'],
    description: 'Include directories in output',
    default: false,
  },
  'absolute-paths': {
    type: 'boolean',
    aliases: ['a'],
    description: 'List out full file paths',
    default: false,
  },
  'matching-criteria': {
    type: 'string',
    aliases: ['m'],
    description:
      'Should the file path need to match all of the glob patterns or any of the glob patterns?',
    choices: ['all', 'any'],
    default: 'all',
  },
  newline: {
    type: 'boolean',
    aliases: ['n'],
    description: 'print newlinws (\n) after each file path.',
    default: false,
  },
  // 'traversal-order': {
  //   type: 'string',
  //   aliases: ['o'],
  //   description: 'List files in depth-first order (df) or breadth-first (bf)',
  //   choices: ['df', 'bf'],
  //   default: 'bf',
  // },
}
