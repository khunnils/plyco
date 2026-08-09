import {
  ApiResponseError,
  createOrgClient,
  readOrgClientConfig,
  type OrgClient,
} from "@plyco/org-client"
import { Command, CommanderError } from "commander"

export type ProgramOptions = {
  env?: NodeJS.ProcessEnv
  exitOverride?: boolean
  fetchFn?: typeof fetch
  orgClient?: OrgClient
  stderr?: Pick<NodeJS.WriteStream, "write">
  stdout?: Pick<NodeJS.WriteStream, "write">
}

type RootOptions = {
  apiUrl?: string
  apiKey?: string
  org?: string
}

export function createProgram({
  env = process.env,
  exitOverride = false,
  fetchFn,
  orgClient,
  stderr = process.stderr,
  stdout = process.stdout,
}: ProgramOptions = {}) {
  const program = new Command()

  program
    .name("plyco")
    .description("Plyco customer CLI for organization data access")
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
    program
      .command(name)
      .description(description)
      .action(async () => {
        writeJson(stdout, await invoke(resolveClient()))
      })
  }

  registerGetCommand(
    "overview",
    "Get the organization profile overview",
    (client) => client.getOverview(),
  )
  registerGetCommand(
    "profile",
    "Get the company profile",
    (client) => client.getProfile(),
  )
  registerGetCommand(
    "services",
    "Get organization services",
    (client) => client.getServices(),
  )
  registerGetCommand(
    "data-types",
    "Get stored data types",
    (client) => client.getDataTypes(),
  )
  registerGetCommand(
    "activities",
    "Get business activities",
    (client) => client.getActivities(),
  )
  registerGetCommand(
    "privacy",
    "Get the privacy profile",
    (client) => client.getPrivacyProfile(),
  )
  registerGetCommand(
    "infrastructure",
    "Get the infrastructure profile",
    (client) => client.getInfrastructureProfile(),
  )
  registerGetCommand(
    "security",
    "Get the security profile",
    (client) => client.getSecurityProfile(),
  )
  registerGetCommand(
    "access",
    "Get the access profile",
    (client) => client.getAccessProfile(),
  )
  registerGetCommand(
    "providers",
    "Get the organization provider inventory",
    (client) => client.getOrganizationProviders(),
  )
  registerGetCommand(
    "service-provider-usage",
    "Get service provider usage",
    (client) => client.getServiceProviderUsage(),
  )
  registerGetCommand(
    "recommendations",
    "Get advisor recommendations",
    (client) => client.getRecommendations(),
  )
  registerGetCommand(
    "vocabulary",
    "Get controlled vocabulary code sets",
    (client) => client.getVocabulary(),
  )

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
