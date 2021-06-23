import type { AsyncParser, Command } from '@commandville/core'

export const list: Command<AsyncParser> = function list() {
  // let hasRun: boolean = false
  // return new Transform({
  //   objectMode: true,
  //   async transform(chunk, enc, cb) {
  //     if(!hasRun) {
  //       const parser = await load('./*.[tj]s')
  //       console.log(parser);
  //       await parser.parse(process.argv.slice(3))
  //       hasRun = true
  //     }
  //     cb()
  //   }
  // })
  return async function parse(argv: string[]) {
    console.log(argv)
  }
  // return async function parse([, ...argv]: string[]) {
  //   console.log(argv);
  //   if(isGlobalCommand(command)) {
  //     return 'TODO load and run a global command'
  //   } else {
  //     const parser = await load('./*.[tj]s')
  //     await parser.parse([command, ...argv])
  //   }
  // }
}

list.command = 'list'
list.description = 'list packages'
