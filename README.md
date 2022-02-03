# Commandville

Build streamable and pipeable CLIs with simple function closures. 

- [Quickstart](#quickstart)
  - [ESM](#esm)
  - [CommonJS](#commonjs)
  - [TypeScript](#typescript)
- [Help Menu](#help-menu)
- [Local Scripts](#local-scripts)
  - [Install](#install)
  - [Define Scripts](#define-scripts)
  - [Run](#run)
- [Environment Variables](#environment-variables)
  - [.env Files](#env-files)
    - [Variable Expansion](#variable-expansion)
    - [Boolean Flags With Environment Variables](#boolean-flags-with-environment-variables)
  - [Env Configurations](#env-configurations)
  - [Example](#example)
- [Config Files](#config-files)
  - [Other Config Formats](#other-config-formats)
- [CLI Options](#cli-options)
  - [Option Types](#option-types)
- [Piping](#piping)
- [Async Commands](#async-commands)
- [Streaming Commands](#streaming-commands)
  - [Mixing Piped Arguments with Positional Args](#mixing-piped-arguments-with-positional-args)
  - [Transform helper](#transform-helper)
    - [Stream Aggregation Example](#stream-aggregation-example)
  - [Pre and Post Command Processing](#pre-and-post-command-processing)
- [Best Practices](#best-practices)
  - [Lean Toward Streaming Commands](#lean-toward-streaming-commands)
  - [Design for Programmatic Use](#design-for-programmatic-use)
  - [Create Composable Commands](#create-composable-commands)
  - [Specify Default Values for Programmmatic and CLI Uses](#specify-default-values-for-programmmatic-and-cli-uses)
  - [Distribute ESM Packages](#distribute-esm-packages)

## Quickstart

`commandville` (alias `cmv`) automatically hoists all exported functions in the `CWD` that define a `.command` property.

### ESM

<!-- prettier-ignore-start -->
```js
// index.mjs

// Outer function recieves named flags.
export function greet({ greeting = 'Hello' }) {

  // Inner closure recieves positional CLI arguments
  return ([name]) => {
    return `${greeting}, ${name}!`
  }
}

// Define the CLI <COMMAND> name
// commandville automatically creates commands
// out of all exported functions with a .command defined
greet.command = 'greet'

// Define command flags and options
// printed when using cmv <COMMAND> --help
greet.options = {
  greeting: {
    type: 'string',
    aliases: ['g']
    description: 'Specify greeting to use.',
  },
}
```

```bash
$ npx commandville greet World --greeting Hi
Hi, World!
```

> :warning: To support [ES modules](https://nodejs.org/dist/latest-v14.x/docs/api/esm.html),  use the `.mjs` file extension or set the `type` field in **package.json** to `module`. View [Determining module system](https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_determining_module_system) for more information. Node ES modules also [require using file extensions for relative import specifiers](https://nodejs.org/dist/latest-v14.x/docs/api/esm.html#esm_import_specifiers), e.g., `import {something} from './relative/index.js`. View this helpful gist on [pure ESM packages in node](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c) for more information.

### CommonJS

```js
// index.cjs
function greet({ greeting = 'Hello' }) {
  return ([name]) => {
    return `${greeting}, ${name}!`
  }
}

greet.command = 'greet'
greet.options = {
  greeting: {
    type: 'string',
    aliases: ['g']
    description: 'Specify greeting to use.',
  },
}

module.exports = greet;

```

### TypeScript

```js
// index.ts
export function greet({ greeting = 'Hello' }) {
  return ([name]) => {
    return `${greeting}, ${name}!`
  }
}
greet.command = 'greet'
greet.options = {
  greeting: {
    type: 'string',
    aliases: ['g']
    description: 'Specify greeting to use.',
  },
}
```

> :warning: [TS-Node](https://www.npmjs.com/package/ts-node) is required to run TypeScript files. Install TS-Node locally or globally before running the following `commandville` command. Alternatively, compile to JavaScript then run `cmv` on the resulting directory.
> 
> To run TypeScript files directly you must instruct node to use the TS-Node loader by setting the `NODE_OPTIONS` environment variable before running the `cmv` command. Instructions for setting environment variables differs between operating systems. Here we are using the [dotenv-cli](https://www.npmjs.com/package/dotenv-cli) package to set the environment variable which should work across operating systems.

```bash title="~/my-project"
$ npx dotenv -v NODE_OPTIONS='--loader ts-node/esm' -- npx commandville greet World
# outputs
Hello, World!
```

## Help Menu

```bash
$ npx commandville --help
cmv [command]

Commands:
  cmv greet

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]  
```

```bash
$ npx commandville greet --help
cmv greet

Options:
      --help      Show help                                            [boolean]
      --version   Show version number                                  [boolean]
  -g, --greeting  Specify greeting to use.                              [string]        
```

## Local Scripts

Commandville is perfect for running local scripts. First install `commandville` using your package manager of choice.

### Install

**NPM**

```bash
$ npm install commandville -D
```

**PNPM**

```bash
$ pnpm add commandville -D
```

**Yarn**

```bash
$ yarn add commandville -D
```

### Define Scripts

Then define your scripts in **package.json**. If you are running TypeScript scripts without first compiling them to JS then be sure to install `ts-node` and to set `NODE_OPTIONS='--loader ts-node/esm'` before running.

**package.json**

```json
{
  "scripts": {
    "greet": "cmv greet",
    "typescriptGreet": "dotenv -v NODE_OPTIONS='--loader ts-node/esm' -- cmv greet" 
  }
}
```

If your scripts exists outside the current working directory, say in a `scripts` subdirectory, then you need to specify the location using a `commandville` config in **package.json**.

```json
{
  "scripts": {
    ... 
  },
  "commandville": {
    "commands: ["./scripts/**"]
  }
}
```

`commands` accepts an array of filepaths, directory paths, or glob patterns that resolve to filepaths. More on configuration later. 

### Run

Finally, run your scripts using your package manager of choice.

**NPM**

```bash
$ npm run greet -- -g Hi World
Hi, World!
```

**PNPM**

```bash
$ pnpm greet -- -g Hi World
Hi, World!
```

> :warning: On windows you may need to run ``$ pnpm greet `-- -g Hi World``. Notice the extra backtick before the `--`.

**Yarn**

```bash
$ yarn greet -g Hi World
Hi, World!
```

## Environment Variables

Commandville automatically passes in all environment variables prefixed with `CMV_` as flag options to the hoisted script. So an environment variable named `CMV_DB_PASSWORD` would be available to the script as `dbPassword` or `db-password` or as any aliases set for the flag. 

### .env Files

Before passing in environment variables prefixed with `CMV_` to the current script, commandville will first load the `.env` file present in the `CWD`, if one is present. 

#### Variable Expansion

Commandville supports variable expansion in `.env` files. 

```bash
# .env
DB_PROVIDER=postgresql
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB=myDB
CMV_DB_CONNECTION_STRING=${DB_PROVIDER}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB}
```

> :warning: In the above example, the `DB_` variables are used to expand out the `CMV_DB_CONNECTION_STRING` variable. Though `DB_` are used in the expansion, they are not directly available to the script since they are not prefixed with `CMV_`. Only the `CMV_DB_CONNECTION_STRING` variable is available to the script as either `dbConnectionString` or `db-connection-string`.

#### Boolean Flags With Environment Variables

To set boolean flags using environment variables set the variable to `true`. All other values will be considered `false`

```bash
# booleanFlag === true
CMV_BOOLEAN_FLAG=true

# booleanFlag === false
CMV_BOOLEAN_FLAG=something

# booleanFlag === false
CMV_BOOLEAN_FLAG=True
```

### Env Configurations

Environment variable related settings can be configured in the `commandville` property of **package.json**

```json
{
  "scripts": {
    ...
  },
  "commandville": {
    "loadEnv": true,
    "envPrefix": "CMV",
    "envFile": ".env",
    "envCwd": "."
  }
}
```

- `loadEnv`: boolean value specifying whether or not to load environment variables. It is possible to load system environment variables without loading a local `.env` file by setting `loadEnv` to `true` and `envFile` to `false`. Defaults to `true`.
- `envPrefix`: Only environment variables starting with `<PREFIX>_` will be passed to the running script. It is possible to set `envPrefix` to `""` but doing so will make all system environment variables available to the running script. It is recommended to use a prefix. Defaults to `CMV`.
- `envFile`: filename of the environment variable file to load. Defaults to `.env`
- `envCwd`: Directory to load the `.env` file from. Defaults to `process.cwd()`.

### Example

**./scripts/db-seed.mjs**, a sample ESM module command pretending to seed a database. 

```js
// ./scripts/db-seed.mjs
export function dbSeed({ dbUser, dbPassword }) {
  return () => {
    // Connect to a database and seed with data.
  }
}

dbSeed.command = 'db-seed'
dbSeed.options = {
  dbUser: {
    type: 'string',
    aliases: ['u']
    description: 'DB user.',
    required: true
  },
  dbPassword: {
    type: 'string',
    aliases: ['p'],
    description: 'DB password.',
    required: true
  }
}
```

**.env**, a local dotenv file, not checked into source control, containg DB credentials.

```bash
# .env
# The environment variable names match the flag names.
CMV_DB_USER=username
CMV_DB_PASSWORD=password
```

**package.json**

```diff json
{
  "scripts": {
-   "db:seed": "cmv db-seed -u $DB_USER -p $DB_PASSWORD",
+   "db:seed": "cmv db-seed",
  },
  "commandville": {
    "commands": ["./scripts/"],
    "loadEnv": true,
    "envFile": ".env",
    "envPrefix": "CMV"
  }
}
```

> :warning: The environment specific configs may be omitted in the above example since the default values are used.

When using environment variables, there is no need to pass in the `db-user` or `db-password` flags. Since the environment variable names match the flag names, they will be available to the running script as if passed in through flag arguments. 

Though the original command, `cmv db-seed -u $DB_USER -p $DB_PASSWORD`, was using environment variables, it was doing so in a way that that is specific to shells that support the `$` environment variable syntax or relies on using supported package managers. On top of that, the original command does not load or use variables defined `.env` files but instead requires that the environment variables are set and available in the running shell prior to executing the script. 

The updated command, `cmv db-seed`, is shell and pacakge manager agnostic and will load environment variables defined in `.env` files.

> :warning: Passed flag arguments take precedence over environment variables of the same name

## Config Files

Let's update the database seeding example to support loading options from a config file.

```diff js
// ./scripts/db-seed.mjs
export function dbSeed({ dbUser, dbPassword }) {
  return () => {
    // Do some DB connection and seeding.
  }
}

dbSeed.command = 'db-seed'
dbSeed.options = {
  dbUser: {
    type: 'string',
    aliases: ['u']
    description: 'DB user.',
    required: true
  },
  dbPassword: {
    type: 'string',
    aliases: ['p'],
    description: 'DB password.',
    required: true
  },
+ "config-file": {
+   type: 'string',
+   aliases: ['c'],
+   description: 'Load options from a config file.',
+   config: true
+ }
}
```

And add a **config.json** file to store the command options.

```json
{
  "dbUser": "username",
  "dbPassword": "password"
}
```

Finally,  update **package.json** to use the config file.

```diff json
{
  "scripts": {
-   "db:seed": "cmv db-seed",
+   "db:seed": "cmv db-seed --config-file ./config.json",
  },
  "commandville": {
    "commands": ["./scripts/"],
-   "loadEnv": true,
+   "loadEnv": false,
-   "envFile": ".env",
-   "envPrefix": "CMV"
  }
}
```

Now our script is using a config file instead of environment variables. This functions the same as the environment variable example, especially if the **config.json** file is not checked into source control. 

One benefit the config file approach has over the environment variable approach is clarity. In the above script, it is clear where the command options are located. With the environment variable example, it is implicitly understood that the script relies on environment variables and that the user must set them either in a `.env` file or in the shell before running the script.   

### Other Config Formats

By default, config option types support loading and parsing JSON files (without comments). Other config formats can be supported by supplying a custom `configParser`.

```diff js
// ./scripts/db-seed.mjs

export function dbSeed({ dbUser, dbPassword }) {
  ...
}

dbSeed.command = 'db-seed'
dbSeed.options = {
  ...
  "config-file": {
    type: 'string',
    aliases: ['c'],
    description: 'Load options from a config file.',
    config: true,
+   configParser: (filePath) => {
+     // validate file exists and ends with .yml|yaml before reading
+     // and parsing or throw an error otherwise
+     return someFunctionParsingYaml(fs.readFileSync(filePath))
+   }
  }
}
```

The `configParser` recieves the file path as an argument and should return a config object representing the flags options or throw an error for validation reasons (file doesn't exist or is in the wrong format, etc). 

> :warning: The `configParser` function has to be synchronous. 

## CLI Options

As shown previously, Options are defined on the `.options` property of the function closure. All options are gathered and passed to the function closure as a plain object.

<!-- prettier-ignore-start -->

```javascript title="~/my-project/index.mjs"
export const helloWorld = (options) => (
  ([name]) => {
    console.log(options)
    return `${options.greeting}, ${name}!`
  }
)

helloWorld.command = 'hello-world'
helloWorld.options = {
  optionOne: {
    description: 'Option One.',
    type: 'string',
  },
  'option-two': {
    description: 'more options',
    type: 'number',
  },
}
```

<!-- prettier-ignore-end -->

Options may be defined using camelCase formatting or hyphenated names. The `--help` menu preserves the defined style.

```bash
$ npx commandville hello-world --help
cmv hello-world

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  --optionOne   Option One                                              [string]
  --option-two  more options                                            [number]
```

The `--help` menu preserves the defined style but the CLI accepts both formatting styles at runtime. The `options` object will contain both formatting styles for every flag. 

In the following example, the greet CLI is called with `optionOne` as a hyphenated flag and `option-two` as a camelCase flag, the opposite of how they are defind in code. Both options are actually availble within the `options` object using either style.

```bash title="~/my-project"
$ npx commandville hello-world --option-one cool --optionTwo 5
{
  "option-one": "cool",
  "optionOne": "cool",
  "optionTwo": 5,
  "option-two": 5
}
hello, world!
```

### Option Types

```ts
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
  nargs?: number
  coerce?: (arg: unknown) => unknown
  default?: unknown
  implies?: string | string
  conflicts?: string | string[]
  normalize?: boolean
  deprecated?: boolean
}
```

- `description`: Human friendly description to print in `--help` menu.
- `type`: The acceptable type for the command option. The `count` type acts as a boolean flag but returns the number of times the flag was used instead of a boolean value. For example, `-ccc` would return `3`.
- `aliases`: Shorthand flag aliases for the option, e.g., `aliases: ['c']` allows for one to use `-c` instead of the full option flag which might be `--config-file`.
- `array`: Allow for the flag to be specified multiple times. Array flags are greedy so they should not be used right before positional args.

```bash
# Wrong
$ cmv some-command --array-option one two three postionalArg
# Right
$ cmv some-command postionalArg --array-option one two three
# Or can be used before another non-greedy flag
$ cmv some-command --array-option one two three --non-greedy-flag four postionalArg
```

- `choices`: Present an `Array<string|number>` of choices to choose from. 
- `configParser`: A parser function excepting a file path and returning an options object. Used by `config` flags to load options from config files instead of the CLI. For example `--config-file filePath`. Defaults to `JSON.parse(fs.readFileSync(filePath, 'utf-8))`. This function needs to be synchronous.
- `config`: Specifies that the option is expecting a filePath to a config file to load options from instead of loading from the command line.

## Piping

Commands hoisted by commandville automatically support piping.

```bash
$ echo "Dave" | npx commandville greet --greeting Hi
Hi, Dave!
```

> :warning: In the above scenario, the entire process.stdin is gathered in memory before being passed to the `cli` function. To fully support streaming, the function closure needs to return a [NodeJS Transform stream](https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_duplex_and_transform_streams). More on that later.

## Async Commands

Simply return an async function from the function closure.

```js
export function helloWorld(flags) {
  return async (postionalArgs) => {
    // Do some async stuff...
  }
}

helloWorld.command = 'hello-world'
...
```

## Streaming Commands

To fully support argument streaming, return a [NodeJS Transform stream](https://nodejs.org/dist/latest-v14.x/docs/api/stream.html#stream_duplex_and_transform_streams) from the command closure.

```js 
// streamer.mjs

import { Transform } from 'stream'

export function streamingCommand(options) => {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, cb) {
      // Check if chunk is a buffer
      const isBuffer = Buffer.isBuffer(chunk)

      // convert chunk to string.
      const value = isBuffer ? chunk.toString('utf-8') : chunk
      const message = `${value} is a buffer: ${isBuffer}`

      // push the value to the next stream.
      // the last write stream in the pipe is stdout.
      this.push(message)
      cb()
    },
  })
}

streamingCommand.command = 'streamer'
```

Instead of recieving all arguments as an array of strings, the transform stream will run for each incoming argument or stream chunk.

```bash
$ npx commandville streamer hello world
hello is a buffer: true
world is a buffer: true
```

Or

```bash
$ cat "some-large-text-file.ext" | npx commandville streamer
chunk1 is a buffer: true
chunk2 is a buffer: true
chunk3 is a buffer: true
...
```

### Mixing Piped Arguments with Positional Args

piped arguments are piped in after all positional arguments.

```bash
$ echo "Dave" | npx commandville streamer hello
hello is a buffer: true
Dave is a buffer: true
```

### Transform helper

`@commandville/transform` is a simple utlility for creating Transform streams using functions. Returning a value automatically pipes the value to the next stream in the pipe. There is no need to call a callback function to indicate that the transform is complete, the completion of the function is enough. `transform` also accepts async functions, allowing for async transformations.

```javascript title="~/my-project/streamer.mjs"
import { transform } from '@commandville/transform'

export function streamingCommand(options) {
  return transform((chunk) => {
    // Check if chunk is a buffer
    const isBuffer = Buffer.isBuffer(chunk)

    // convert chunk to string.
    const value = isBuffer ? chunk.toString('utf-8') : chunk

    console.log(`${value} is a buffer: ${isBuffer}`)

    // send value to the next transform in the pipeline
    return value
  })
}

streamingCommand.command = 'streamer'
```

#### Stream Aggregation Example

Here is an example of using `@commandville/transform` to aggregate over a stream to concatenate all stream chunks into a single string. The aggregated string is 

```js
import { transform } from '@commandville/transform'

export function streamingCommand(options) {
  const cliChunks = []
  return transform(
    (chunk) => {
      // Check if chunk is a buffer
      const isBuffer = Buffer.isBuffer(chunk)

      // convert chunk to string.
      const value = isBuffer ? chunk.toString('utf-8') : chunk

      // don't send individual chunks to the next transform in the pipeline.
      // instead, build up chunks to output at the end.
      cliChunks.push(value)
    },
    () => {
      // This function runs at the end of the input stream
      // return all the input chunks as one string
      return cliChunks.join(' ')
    },
  )
}

streamingCommand.command = 'streamer'
```

```bash
$ npx commandville streamer hello world
hello world
$ echo "Doe" | npx commandville streamer Greetings John
Greetings John Doe
```

### Pre and Post Command Processing



## Best Practices

### Lean Toward Streaming Commands

Though simple function closures work for simple CLI use cases and local one-off package scripts, the streaming API should be used for distributed, reusable CLI tools. The streaming API not only supports streaming and piping in the shell but it also supports programmatic composition, allowing one to build and distribute larger CLI tools and pipelines composed of smaller CLI packages. The streaming API is the more flexible and composable. For these reasons, we recommend using `@commandville/transform` for building stream based CLI tools when possible.

### Design for Programmatic Use

[Do one thing and do it well](https://en.wikipedia.org/wiki/Unix_philosophy). Commandville was designed to hoist functions that were created for programmatic use as an extra benefit and API surface to that function. Design function closures to work with with expected data types and use `preprocess` capabilities to shape/validate 

### Create Composable Commands

### Specify Default Values for Programmmatic and CLI Uses

### Distribute ESM Packages

Commandville 
