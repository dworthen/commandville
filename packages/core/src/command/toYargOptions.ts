import { readFileSync } from 'fs'
import type { Options } from 'yargs'

import { nu } from '../utils/index.js'
import type { CommandOptions } from './types'

export default function toYargsOptions(
  commands: CommandOptions,
): Record<string, Options> {
  return Object.entries(commands).reduce<Record<string, Options>>(
    (acc, [key, value]) => {
      const {
        description,
        type,
        aliases,
        array,
        choices,
        configParser,
        config,
        required,
        requiresArgs,
        coerce,
        default: d,
        implies,
        conflicts,
        nargs,
        normalize,
        deprecated,
      } = value

      const defaultConfigParser = (
        filePath: string,
      ): Record<string, unknown> => {
        return JSON.parse(readFileSync(filePath, 'utf-8'))
      }

      acc[key] = {
        description,
        type,
        ...(nu(aliases) && { alias: aliases }),
        ...(nu(array) && { array }),
        ...(nu(choices) && { choices }),
        ...(nu(config) && {
          config,
          configParser: configParser ?? defaultConfigParser,
        }),
        ...(nu(required) && { demandOption: required }),
        ...(nu(requiresArgs) && { requiresArg: requiresArgs }),
        ...(nu(coerce) && { coerce }),
        ...(nu(d) && { default: d }),
        ...(nu(implies) && { implies }),
        ...(nu(conflicts) && { conflicts }),
        ...(nu(nargs) && { nargs }),
        ...(nu(normalize) && { normalize }),
        ...(nu(deprecated) && { deprecated }),
      }

      return acc
    },
    {},
  )
}
