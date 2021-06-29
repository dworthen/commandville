import { load } from '@commandville/core'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

// eslint-disable-next-line
const __dirname = dirname(fileURLToPath(import.meta.url))

load(
  [
    /* { path: './commands/*.js', cwd: __dirname}, */ {
      path: './*.@(?(m)j|t)s',
    },
  ],
  {
    program: 'cmv',
  },
)
  .then(async ({ parse }) => {
    return await parse(process.argv.slice(2))
  })
  .catch((ex) => {
    throw ex
  })
