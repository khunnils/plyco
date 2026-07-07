import { Command, CommanderError } from "commander"

import { ApiResponseError, deleteJson, postJson } from "./api.js"
import { readCliConfig } from "./config.js"

export type ProgramOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  exitOverride?: boolean
  fetchFn?: typeof fetch
  stderr?: Pick<NodeJS.WriteStream, "write">
  stdout?: Pick<NodeJS.WriteStream, "write">
}

export function createProgram({
  cwd,
  env = process.env,
  exitOverride = false,
  fetchFn,
  stderr = process.stderr,
  stdout = process.stdout,
}: ProgramOptions = {}) {
  const program = new Command()

  program
    .name("plyco")
    .description("Plyco operations tool")
    .option("--profile <name>", "CLI profile from .plyco/<name>.env", "local")

  program
    .command("codes")
    .description("Manage vocabulary codes")
    .command("load")
    .description("Load system code sets from the configured API environment")
    .action(async () => {
      const config = commandConfig(program, { cwd, env })
      const result = await postJson(
        { apiKey: config.apiKey, apiUrl: config.apiUrl, fetchFn },
        "/codes/load",
      )

      writeJson(stdout, result)
    })

  const providers = program
    .command("providers")
    .description("Provider lookup and import tools")

  providers
    .command("lookup")
    .description("Resolve provider details for a URL")
    .argument("[url]", "provider URL")
    .option("--url <url>", "provider URL")
    .action(async (url: string | undefined, options) => {
      await runProviderCommand("lookup", url, options.url, program, {
        cwd,
        env,
        fetchFn,
        stdout,
      })
    })

  providers
    .command("import")
    .description("Resolve and import provider details for a URL")
    .argument("[url]", "provider URL")
    .option("--url <url>", "provider URL")
    .action(async (url: string | undefined, options) => {
      await runProviderCommand("import", url, options.url, program, {
        cwd,
        env,
        fetchFn,
        stdout,
      })
    })

  const waitlist = program
    .command("waitlist")
    .description("Manage waitlist entries")

  waitlist
    .command("add")
    .description("Add an email to the waitlist")
    .argument("[email]", "waitlist email")
    .option("--email <email>", "waitlist email")
    .option("--blocker <text>", "optional compliance blocker")
    .action(async (email: string | undefined, options) => {
      const inputEmail = requiredEmail(email, options.email, "add")
      const config = commandConfig(program, { cwd, env })
      const result = await postJson(
        { apiKey: config.apiKey, apiUrl: config.apiUrl, fetchFn },
        "/waitlist",
        {
          email: inputEmail,
          blocker: options.blocker,
        },
      )

      writeJson(stdout, result)
    })

  waitlist
    .command("remove")
    .description("Remove an email from the waitlist")
    .argument("[email]", "waitlist email")
    .option("--email <email>", "waitlist email")
    .action(async (email: string | undefined, options) => {
      const inputEmail = requiredEmail(email, options.email, "remove")
      const config = commandConfig(program, { cwd, env })
      const result = await deleteJson(
        { apiKey: config.apiKey, apiUrl: config.apiUrl, fetchFn },
        "/waitlist",
        { email: inputEmail },
      )

      writeJson(stdout, result)
    })

  program.configureOutput({
    writeErr: (message) => stderr.write(message),
    writeOut: (message) => stdout.write(message),
  })

  if (exitOverride) {
    program.exitOverride()
  }

  return program
}

function requiredEmail(
  positionalEmail: string | undefined,
  optionEmail: string | undefined,
  action: "add" | "remove",
) {
  const email = optionEmail ?? positionalEmail

  if (!email) {
    throw new Error(
      `A waitlist email is required. Pass --email <email> or a positional email to ${action}.`,
    )
  }

  return email
}

function commandConfig(
  program: Command,
  options: { cwd?: string; env: NodeJS.ProcessEnv },
) {
  const rootOptions = program.opts<{ profile: string }>()

  return readCliConfig({
    cwd: options.cwd,
    env: options.env,
    profile: rootOptions.profile,
  })
}

async function runProviderCommand(
  subcommand: "lookup" | "import",
  positionalUrl: string | undefined,
  optionUrl: string | undefined,
  command: Command,
  options: {
    cwd?: string
    env: NodeJS.ProcessEnv
    fetchFn?: typeof fetch
    stdout: Pick<NodeJS.WriteStream, "write">
  },
) {
  const inputUrl = optionUrl ?? positionalUrl

  if (!inputUrl) {
    throw new Error("A provider URL is required. Pass --url <url> or a positional URL.")
  }

  const config = commandConfig(command, options)
  const result = await postJson(
    { apiKey: config.apiKey, apiUrl: config.apiUrl, fetchFn: options.fetchFn },
    `/providers/${subcommand}`,
    { inputUrl },
  )

  writeJson(options.stdout, result)
}

function writeJson(stdout: Pick<NodeJS.WriteStream, "write">, value: unknown) {
  stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

export function printCliError(
  error: unknown,
  stderr: Pick<NodeJS.WriteStream, "write"> = process.stderr,
) {
  if (error instanceof ApiResponseError) {
    stderr.write(`${JSON.stringify(error.body, null, 2)}\n`)
  } else if (error instanceof Error) {
    stderr.write(`${error.message}\n`)
  } else {
    stderr.write(`${String(error)}\n`)
  }
}

export function isCliHelpExit(error: unknown) {
  return (
    error instanceof CommanderError &&
    (error.code === "commander.help" || error.code === "commander.helpDisplayed")
  )
}
