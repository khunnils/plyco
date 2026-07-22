import { type OrganizationSummary } from "@plyco/shared"
import { Copy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100"
const API_KEY_PLACEHOLDER = "YOUR_PLYCO_API_KEY"

const buildMcpConfig = (organizationId: string) =>
  JSON.stringify(
    {
      mcpServers: {
        plyco: {
          command: "npx",
          args: ["-y", "@plyco/mcp"],
          env: {
            PLYCO_API_URL: API_URL,
            PLYCO_API_KEY: API_KEY_PLACEHOLDER,
            PLYCO_ORGANIZATION_ID: organizationId,
          },
        },
      },
    },
    null,
    2
  )

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
    toast.success("MCP config copied to clipboard")
  } catch {
    toast.error("Could not copy MCP config")
  }
}

export const McpServerSettings = ({
  organization,
}: {
  organization: OrganizationSummary
}) => {
  const config = buildMcpConfig(organization.id)

  return (
    <section className="grid gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">MCP server</h2>
        <p className="mt-1 text-sm text-slate-500">
          Connect an AI agent to this organization&apos;s workspace with
          read-only access.
        </p>
      </div>

      <div className="grid gap-3 border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              MCP configuration
            </h3>
            <p className="mt-1 max-w-2xl text-xs text-slate-500">
              Replace {API_KEY_PLACEHOLDER} with a key copied when it was
              created in the API Keys tab. Existing key values cannot be shown
              again.
            </p>
          </div>
          <Button
            className="self-start"
            size="sm"
            type="button"
            variant="outline"
            onClick={() => copyToClipboard(config)}
          >
            <Copy />
            Copy config
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-sm border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs leading-5 text-slate-900">
          {config}
        </pre>
      </div>
    </section>
  )
}
