import type { Command } from '../command/types'

export interface ProgramDescription {
  program: string
  commands: Command[]
  cwd?: string
  defaultCommand?: string
  version?: string
  config?: Record<string, unknown>
  loadEnv?: boolean
  envPrefix?: string
  envFile?: string
}

export interface ProgramParser {
  parse: (argv: string[]) => Promise<void>
}
