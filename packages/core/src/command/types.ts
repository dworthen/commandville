import type { Duplex } from 'stream'
import type { Choices } from 'yargs'

export interface CommandOption {
  description: string
  type: 'string' | 'number' | 'boolean' | 'count'
  aliases?: string | string[]
  array?: boolean
  choices?: Choices
  configParser?: (configPath: string) => object
  config?: boolean
  required?: boolean
  requiresArgs?: boolean
  coerce?: (arg: unknown) => unknown
  default?: unknown
  implies?: string | string
  conflicts?: string | string[]
  nargs?: number
  normalize?: boolean
  deprecated?: boolean
}

export type CommandOptions = Record<string, CommandOption>

export interface CommandConfig {
  [key: string]: unknown
}

export type StreamParser = Duplex

// eslint-disable-next-line
export type AsyncParser = (args: string[]) => Promise<string | void>

// eslint-disable-next-line
export type Parser = (args: string[]) => string | void
export type CliParser = StreamParser | AsyncParser | Parser

export interface CommandDescription {
  command: string
  description: string
  aliases?: string | string[]
  deprecated?: boolean
  options?: CommandOptions
  preprocess?: Duplex
  postprocess?: Duplex
}

export interface Command<
  R extends StreamParser | AsyncParser | Parser = CliParser,
  T extends CommandConfig = CommandConfig,
> extends CommandDescription {
  (configOptions: T): R
}

export type CliHandler = (args: Record<string, unknown>) => Promise<void> // eslint-disable-line
