import type { Command } from '../command/types'

export interface ProgramDescription {
  program: string
  commands: Command[]
  defaultCommand?: string
  version?: string
  config?: Record<string, unknown>
  loadEnv?: boolean
  envPrefix?: string
  envFile?: string
  envCwd?: string
}

export interface ProgramParser {
  parse: (argv: string[]) => Promise<void>
}
