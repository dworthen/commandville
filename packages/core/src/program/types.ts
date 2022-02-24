import type { Command } from '../command/types'

export type EnvConfig = {
  loadEnv?: boolean
  prefix?: string
  files?: string[]
}
export type ProgramDescription = {
  program: string
  commands: Command[]
  defaultCommand?: string
  description?: string
  helpFlag?: string
  version?: string
  config?: Record<string, unknown>
  noUnknownOptions?: boolean
  env?: EnvConfig
  showHelpOnFailure?: boolean
}

export type ProgramParser = {
  parse: (argv: string[]) => Promise<void>
}
