import { CliPositionalArgumentStreamParser, Command } from '@commandville/core'
import { transform } from '@commandville/transform'
import { createReadStream } from 'fs'
import { resolve } from 'path'
import type { Transform } from 'stream'

export type ReadFileOptions = {
  cwd?: string
}

export const readFile: Command<
  ReadFileOptions,
  CliPositionalArgumentStreamParser
> = function readFile(options) {
  const { cwd = process.cwd() } = options

  return transform(async function t(this: Transform, chunk: string) {
    const filePath = resolve(cwd, chunk)
    console.log(`File path: ${filePath}`)
    // eslint-disable-next-line
    const self = this
    await new Promise<void>((resolve, reject) => {
      const rs = createReadStream(filePath, { encoding: 'utf-8' })
      rs.on('data', (data) => {
        self.push(data)
      })
      rs.on('end', () => {
        resolve()
      })
    })
  })
}

readFile.commandName = '$0'
readFile.options = {
  cwd: {
    type: 'string',
    description: 'Change CWD',
    default: '.',
  },
}
