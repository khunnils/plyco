import {
  ApiResponseError,
  createOrgClient,
  readOrgClientConfig,
  type OrgClient,
} from "@plyco/api-client"
import { Command, CommanderError } from "commander"
import { readFile } from "node:fs/promises"
import { stdin as stdinStream } from "node:process"

export type ProgramOptions = {
  env?: NodeJS.ProcessEnv
  exitOverride?: boolean
  fetchFn?: typeof fetch
  orgClient?: OrgClient
  stderr?: Pick<NodeJS.WriteStream, "write">
  stdout?: Pick<NodeJS.WriteStream, "write">
  stdin?: NodeJS.ReadableStream
}

type RootOptions = {
  apiUrl?: string
  apiKey?: string
  org?: string
}

type JsonInputOptions = {
  file?: string
}

export function createProgram({
  env = process.env,
  exitOverride = false,
  fetchFn,
  orgClient,
  stderr = process.stderr,
  stdout = process.stdout,
  stdin = stdinStream,
}: ProgramOptions = {}) {
  const program = new Command()

  program
    .name("plyco")
    .description(
      "Plyco customer CLI for organization data access and updates",
    )
    .option("--api-url <url>", "Plyco API base URL (overrides PLYCO_API_URL)")
    .option("--api-key <key>", "Organization API key (overrides PLYCO_API_KEY)")
    .option(
      "--org <id>",
      "Organization ID (overrides PLYCO_ORGANIZATION_ID)",
    )

  const resolveClient = () => {
    if (orgClient) {
      return orgClient
    }

    const options = program.opts<RootOptions>()
    const config = readOrgClientConfig({
      apiUrl: options.apiUrl,
      apiKey: options.apiKey,
      organizationId: options.org,
      env,
    })

    return createOrgClient(config, { fetchFn })
  }

  const registerGetCommand = (
    name: string,
    description: string,
    invoke: (client: OrgClient) => Promise<unknown>,
  ) => {
    const command = program.command(name).description(description)
    command.action(async () => {
      writeJson(stdout, await invoke(resolveClient()))
    })
    return command
  }

  const addJsonUpdateCommand = (
    parent: Command,
    description: string,
    invoke: (client: OrgClient, body: unknown) => Promise<unknown>,
  ) => {
    parent
      .command("update")
      .description(description)
      .option(
        "--file <path>",
        "JSON file to send (defaults to stdin when omitted)",
      )
      .action(async (options: JsonInputOptions) => {
        const body = await readJsonInput(options.file, stdin)
        writeJson(stdout, await invoke(resolveClient(), body))
      })
  }

  const addJsonBodyCommand = (
    parent: Command,
    name: string,
    description: string,
    invoke: (client: OrgClient, body: unknown) => Promise<unknown>,
  ) => {
    parent
      .command(name)
      .description(description)
      .option(
        "--file <path>",
        "JSON file to send (defaults to stdin when omitted)",
      )
      .action(async (options: JsonInputOptions) => {
        const body = await readJsonInput(options.file, stdin)
        writeJson(stdout, await invoke(resolveClient(), body))
      })
  }

  const profile = registerGetCommand(
    "profile",
    "Get the company profile",
    (client) => client.getProfile(),
  )
  addJsonUpdateCommand(profile, "Update the company profile", (client, body) =>
    client.updateProfile(body),
  )

  const services = registerGetCommand(
    "services",
    "Get organization services",
    (client) => client.getServices(),
  )
  addJsonUpdateCommand(services, "Update organization services", (client, body) =>
    client.updateServices(body),
  )

  registerGetCommand(
    "data-types",
    "Get stored data types",
    (client) => client.getDataTypes(),
  )

  const data = program.command("data").description("Organization data handling")
  addJsonUpdateCommand(
    data,
    "Update the data handling profile",
    (client, body) => client.updateDataHandling(body),
  )

  const activities = registerGetCommand(
    "activities",
    "Get business activities",
    (client) => client.getActivities(),
  )
  addJsonBodyCommand(
    activities,
    "add",
    "Create a business activity",
    (client, body) => client.addActivity(body),
  )
  activities
    .command("update")
    .description("Update a business activity")
    .argument("<id>", "activity ID")
    .option(
      "--file <path>",
      "JSON file to send (defaults to stdin when omitted)",
    )
    .action(async (id: string, options: JsonInputOptions) => {
      const body = await readJsonInput(options.file, stdin)
      writeJson(stdout, await resolveClient().updateActivity(id, body))
    })
  activities
    .command("remove")
    .description("Delete a business activity")
    .argument("<id>", "activity ID")
    .action(async (id: string) => {
      writeJson(stdout, await resolveClient().removeActivity(id))
    })

  const privacy = registerGetCommand(
    "privacy",
    "Get the privacy profile",
    (client) => client.getPrivacyProfile(),
  )
  addJsonUpdateCommand(privacy, "Update the privacy profile", (client, body) =>
    client.updatePrivacyProfile(body),
  )

  const infrastructure = registerGetCommand(
    "infrastructure",
    "Get the infrastructure profile",
    (client) => client.getInfrastructureProfile(),
  )
  addJsonUpdateCommand(
    infrastructure,
    "Update the infrastructure profile",
    (client, body) => client.updateInfrastructureProfile(body),
  )

  const security = registerGetCommand(
    "security",
    "Get the security profile",
    (client) => client.getSecurityProfile(),
  )
  addJsonUpdateCommand(
    security,
    "Update the security profile",
    (client, body) => client.updateSecurityProfile(body),
  )

  const access = registerGetCommand(
    "access",
    "Get the access profile",
    (client) => client.getAccessProfile(),
  )
  addJsonUpdateCommand(access, "Update the access profile", (client, body) =>
    client.updateAccessProfile(body),
  )

  registerGetCommand(
    "overview",
    "Get the organization profile overview",
    (client) => client.getOverview(),
  )

  const providers = registerGetCommand(
    "providers",
    "Get the organization provider inventory",
    (client) => client.getOrganizationProviders(),
  )
  addJsonBodyCommand(
    providers,
    "add",
    "Add an organization provider",
    (client, body) => client.addOrganizationProvider(body),
  )
  providers
    .command("update")
    .description("Update an organization provider")
    .argument("<id>", "provider inventory ID")
    .option(
      "--file <path>",
      "JSON file to send (defaults to stdin when omitted)",
    )
    .action(async (id: string, options: JsonInputOptions) => {
      const body = await readJsonInput(options.file, stdin)
      writeJson(
        stdout,
        await resolveClient().updateOrganizationProvider(id, body),
      )
    })
  providers
    .command("remove")
    .description("Remove an organization provider")
    .argument("<id>", "provider inventory ID")
    .action(async (id: string) => {
      writeJson(stdout, await resolveClient().removeOrganizationProvider(id))
    })
  addJsonBodyCommand(
    providers,
    "resolve",
    "Resolve provider details from a URL",
    (client, body) => client.resolveProvider(body),
  )

  const usage = registerGetCommand(
    "service-provider-usage",
    "Get service provider usage",
    (client) => client.getServiceProviderUsage(),
  )
  addJsonBodyCommand(
    usage,
    "add",
    "Create a service provider usage record",
    (client, body) => client.addServiceProviderUsage(body),
  )
  usage
    .command("update")
    .description("Update a service provider usage record")
    .argument("<id>", "usage ID")
    .option(
      "--file <path>",
      "JSON file to send (defaults to stdin when omitted)",
    )
    .action(async (id: string, options: JsonInputOptions) => {
      const body = await readJsonInput(options.file, stdin)
      writeJson(
        stdout,
        await resolveClient().updateServiceProviderUsage(id, body),
      )
    })
  usage
    .command("remove")
    .description("Delete a service provider usage record")
    .argument("<id>", "usage ID")
    .action(async (id: string) => {
      writeJson(stdout, await resolveClient().removeServiceProviderUsage(id))
    })

  registerGetCommand(
    "recommendations",
    "Get advisor recommendations",
    (client) => client.getRecommendations(),
  )

  const vocabulary = registerGetCommand(
    "vocabulary",
    "Get controlled vocabulary code sets",
    (client) => client.getVocabulary(),
  )
  const vocabularyCodes = vocabulary
    .command("codes")
    .description("Manage vocabulary codes")
  vocabularyCodes
    .command("add")
    .description("Create a vocabulary code")
    .argument("<codeSetId>", "code set ID")
    .option(
      "--file <path>",
      "JSON file to send (defaults to stdin when omitted)",
    )
    .action(async (codeSetId: string, options: JsonInputOptions) => {
      const body = await readJsonInput(options.file, stdin)
      writeJson(
        stdout,
        await resolveClient().addVocabularyCode(codeSetId, body),
      )
    })
  vocabularyCodes
    .command("update")
    .description("Update a vocabulary code")
    .argument("<codeSetId>", "code set ID")
    .argument("<codeId>", "code ID")
    .option(
      "--file <path>",
      "JSON file to send (defaults to stdin when omitted)",
    )
    .action(
      async (codeSetId: string, codeId: string, options: JsonInputOptions) => {
        const body = await readJsonInput(options.file, stdin)
        writeJson(
          stdout,
          await resolveClient().updateVocabularyCode(codeSetId, codeId, body),
        )
      },
    )
  vocabularyCodes
    .command("remove")
    .description("Delete a vocabulary code")
    .argument("<codeSetId>", "code set ID")
    .argument("<codeId>", "code ID")
    .action(async (codeSetId: string, codeId: string) => {
      writeJson(
        stdout,
        await resolveClient().removeVocabularyCode(codeSetId, codeId),
      )
    })

  const templates = program
    .command("templates")
    .description("Document templates")

  templates
    .command("list")
    .description("List document templates")
    .action(async () => {
      writeJson(stdout, await resolveClient().listTemplates())
    })

  const documents = program
    .command("documents")
    .description("Generated documents")

  documents
    .command("list")
    .description("List generated documents")
    .action(async () => {
      writeJson(stdout, await resolveClient().listDocuments())
    })

  documents
    .command("get")
    .description("Get a generated document by ID")
    .argument("<documentId>", "document ID")
    .action(async (documentId: string) => {
      writeJson(stdout, await resolveClient().getDocument(documentId))
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

async function readJsonInput(
  filePath: string | undefined,
  stdin: NodeJS.ReadableStream,
): Promise<unknown> {
  const raw =
    filePath === undefined
      ? await readStream(stdin)
      : await readFile(filePath, "utf8")

  if (!raw.trim()) {
    throw new Error(
      "JSON input is required. Pass --file <path> or pipe JSON on stdin.",
    )
  }

  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new Error("Input is not valid JSON.")
  }
}

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }

  return Buffer.concat(chunks).toString("utf8")
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
