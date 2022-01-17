import { CommandLocation, load } from '@commandville/core'
import findUp from 'find-up'
import { existsSync, promises as fs } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// eslint-disable-next-line
const __dirname = dirname(fileURLToPath(import.meta.url))

interface CommandvilleConfig {
  commands?: string[]
  config?: Record<string, unknown>
  loadEnv?: boolean
  envPrefix?: string
  envFile?: string
  envCwd?: string
}

function isTsEnabled(): boolean {
  return /--loader(=|\s+)ts-node\/esm/i.test(process.env.NODE_OPTIONS ?? '')
}

async function getFilePath(
  filename: string,
  cwd?: string,
): Promise<string | undefined> {
  return await findUp(filename, {
    type: 'file',
    cwd,
  })
}

async function loadJson<T>(
  filePath: string,
  key?: string,
): Promise<T | undefined> {
  if (!existsSync(filePath)) return

  const json = JSON.parse(await fs.readFile(filePath, 'utf-8'))

  return (key != null ? json[key] : json) as T
}

async function run(argv: string[]): Promise<void> {
  let commands: CommandLocation[] = []
  let config: CommandvilleConfig = {
    loadEnv: false,
    envPrefix: 'CMV',
    envFile: '.env',
    envCwd: process.cwd(),
  }
  const cmvPkg = JSON.parse(
    await fs.readFile(resolve(__dirname, '../package.json'), 'utf-8'),
  )

  const localPackageFilePath = await getFilePath('package.json')
  const localDotFilePath = await getFilePath('.commandville.json')

  if (localPackageFilePath != null)
    await _loadConfigFile(localPackageFilePath, 'commandville')

  if (localDotFilePath != null) await _loadConfigFile(localDotFilePath)

  if (commands.length === 0) _setDefaultCommand()

  function _setDefaultCommand(): void {
    commands.push({
      filePathOrGlob: `./*.{mjs,js${isTsEnabled() ? ',ts' : ''}}`,
      cwd: process.cwd(),
    })
  }

  async function _loadConfigFile(path: string, key?: string): Promise<void> {
    const localConfig = await loadJson<CommandvilleConfig>(path, key)
    _setCommands(dirname(path), localConfig)
  }
  function _setCommands(cwd: string, localConfig?: CommandvilleConfig): void {
    commands =
      localConfig?.commands?.map((filePathOrGlob) => ({
        filePathOrGlob,
        cwd,
      })) ?? commands
    config = {
      ...config,
      ...localConfig,
    }
  }

  const { parse } = await load({
    commands,
    program: 'cmv',
    version: cmvPkg.version,
    ...config,
  })

  await parse(argv)
}

run(process.argv.slice(2)).catch((ex) => {
  throw ex
})
