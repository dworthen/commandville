#!/usr/bin/env node

import { loadProgram, ProgramLoader } from '@commandville/core'
import { findUp } from 'find-up'
import { existsSync, promises as fs } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// eslint-disable-next-line
// const __dirname = dirname(fileURLToPath(import.meta.url))

export type CommandvilleConfig = ProgramLoader

function isTsEnabled(): boolean {
  return /--loader(=|\s+)ts-node\/esm/i.test(process.env.NODE_OPTIONS ?? '')
}

async function getFilePath(
  filename: string,
  cwd?: string,
): Promise<string | undefined> {
  const filePath = await findUp(filename, {
    type: 'file',
    cwd,
  })
  return filePath
}

async function loadJson<T>(
  filePath: string,
  key?: string,
): Promise<T | undefined> {
  if (!existsSync(filePath)) return

  const json = JSON.parse(await fs.readFile(filePath, 'utf-8'))

  return (key != null ? json[key] : json) as T | undefined
}

async function run(argv: string[]): Promise<void> {
  let config: Partial<CommandvilleConfig> = {}

  const cmvPkg = JSON.parse(
    await fs.readFile(resolve(__dirname, '../../package.json'), 'utf-8'),
  )
  const localPackageFilePath = await getFilePath('package.json')
  const localDotFilePath = await getFilePath('.commandville.json')

  if (localPackageFilePath != null) {
    config =
      (await loadJson<CommandvilleConfig>(
        localPackageFilePath,
        'commandville',
      )) ?? config
  }

  if (localDotFilePath != null) {
    config = (await loadJson<CommandvilleConfig>(localDotFilePath)) ?? config
  }

  if (config.commands == null || config.commands.length === 0) {
    config.commands = [
      {
        filePathOrGlob: `./*.{cjs,mjs,js${isTsEnabled() ? ',ts' : ''}}`,
        cwd: process.cwd(),
      },
    ]
  }

  const envConfig = {
    loadEnv: true,
    prefix: 'CMV',
    files: ['.env'],
    cwd: process.cwd(),
    ...config?.env,
  }

  // async function _loadConfigFile(path: string, key?: string): Promise<void> {
  //   const localConfig = await loadJson<CommandvilleConfig>(path, key)
  //   _setCommands(dirname(path), localConfig)
  // }

  // function _setCommands(cwd: string, localConfig?: CommandvilleConfig): void {
  //   commands =
  //     localConfig?.commands?.map((filePathOrGlob) => ({
  //       filePathOrGlob,
  //       cwd,
  //     })) ?? commands

  //   config = {
  //     ...config,
  //     ...localConfig,
  //   }
  // }

  const { parse } = await loadProgram({
    ...config,
    commands: config.commands,
    env: envConfig,
    program: 'cmv',
    description: 'Commandville',
    noUnknownOptions: false,
    version: cmvPkg.version ?? '0',
  })

  await parse(argv)
}

await run(process.argv.slice(2))
