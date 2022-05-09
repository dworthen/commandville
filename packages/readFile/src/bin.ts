#!/usr/bin/env node

import { program } from '@commandville/core'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

import { readFile } from './index.js'

// eslint-disable-next-line
// const __dirname = dirname(fileURLToPath(import.meta.url))

const prog = program({
  program: 'read-file <file_path> [options]',
  commands: [readFile],
  version:
    JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'))
      .version ?? '0',
  showHelpOnFailure: true,
  noUnknownOptions: true,
  env: {
    loadEnv: false,
  },
})

prog.parse(process.argv.slice(2)).catch((ex) => {
  throw ex
})
