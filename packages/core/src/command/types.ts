import type { Duplex } from 'stream'
export type CommandOptionDescription = {
  description: string
  type: 'string' | 'number' | 'boolean' | 'count'
  aliases?: string[]
  array?: boolean
  choices?: Array<string | number>
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

export type CommandOptions = Record<string, CommandOptionDescription>

// export interface ParsedCommandFlags {
//   [key: string]: unknown
// }

export type CliPositionalArgumentStreamParser = Duplex

export type CliPositionalArgumentAsyncParser = (
  args: string[],
  // eslint-disable-next-line
) => Promise<string | void>

// eslint-disable-next-line
export type CliPositionalArgumentSyncParser = (args: string[]) => string | void
export type CliPostionalArgumentParser =
  | CliPositionalArgumentStreamParser
  | CliPositionalArgumentAsyncParser
  | CliPositionalArgumentSyncParser

export type CommandDescription = {
  commandName: string
  description?: string
  aliases?: string[]
  deprecated?: boolean
  options?: CommandOptions
  preprocess?: Duplex
  postprocess?: Duplex
  disablePreprocess?: boolean
  disablePostprocess?: boolean
}

export interface Command<
  ParsedCommandFlags extends Record<string, unknown> = Record<string, unknown>,
  CliPositionalArgumentParser extends
    | CliPositionalArgumentStreamParser
    | CliPositionalArgumentAsyncParser
    | CliPositionalArgumentSyncParser = CliPostionalArgumentParser,
> extends CommandDescription {
  (commandFlags: ParsedCommandFlags): CliPositionalArgumentParser
}
