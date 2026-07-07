import {
  createOrganizationApiKeySchema,
  type CreatedOrganizationApiKey,
  type OrganizationSummary,
} from "@plyco/shared"
import { Copy, KeyRound, Trash2 } from "lucide-react"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useCreateOrganizationApiKey,
  useOrganizationApiKeys,
  useRevokeOrganizationApiKey,
} from "@/features/settings/hooks/use-api-keys"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4100"

const buildMcpConfig = (organizationId: string, key: string) =>
  JSON.stringify(
    {
      mcpServers: {
        plyco: {
          command: "npx",
          args: ["-y", "@plyco/mcp"],
          env: {
            PLYCO_API_URL: API_URL,
            PLYCO_API_KEY: key,
            PLYCO_ORGANIZATION_ID: organizationId,
          },
        },
      },
    },
    null,
    2
  )

const copyToClipboard = async (value: string, label: string) => {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copied to clipboard`)
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`)
  }
}

export const ApiKeySettings = ({
  organization,
}: {
  organization: OrganizationSummary
}) => {
  const isOwner = organization.role === "owner"
  const apiKeys = useOrganizationApiKeys(organization.id, isOwner)
  const createApiKey = useCreateOrganizationApiKey(organization.id)
  const revokeApiKey = useRevokeOrganizationApiKey(organization.id)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [createdKey, setCreatedKey] = useState<CreatedOrganizationApiKey | null>(
    null
  )

  if (!isOwner) {
    return (
      <p className="text-sm text-slate-500">
        Only organization owners can manage API keys.
      </p>
    )
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = createOrganizationApiKeySchema.safeParse({ name })

    if (!parsed.success) {
      setNameError("Enter a name for this key.")
      return
    }

    setNameError(null)
    createApiKey.mutate(parsed.data, {
      onSuccess: (apiKey) => {
        setCreatedKey(apiKey)
        setName("")
      },
    })
  }

  const keys = apiKeys.data ?? []

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">API keys</h2>
          <p className="mt-1 text-sm text-slate-500">
            API keys grant read-only access to this organization&apos;s
            workspace data, for tools like the Plyco MCP server. Treat them like
            passwords.
          </p>
        </div>

        <form
          className="grid gap-3 border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={handleCreate}
        >
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            <span>Key name</span>
            <Input
              value={name}
              placeholder="MCP server"
              onChange={(event) => setName(event.target.value)}
            />
            {nameError ? (
              <span className="text-xs text-red-700">{nameError}</span>
            ) : null}
          </label>
          <div className="flex items-end">
            <Button disabled={createApiKey.isPending} type="submit">
              <KeyRound />
              Create key
            </Button>
          </div>
        </form>

        {createdKey ? (
          <div className="grid gap-3 border border-emerald-200 bg-emerald-50/60 p-4">
            <div>
              <h3 className="text-sm font-semibold text-emerald-900">
                Copy your API key now
              </h3>
              <p className="mt-1 text-xs text-emerald-800">
                This is the only time the full key is shown. Store it securely.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-sm border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-900">
                {createdKey.key}
              </code>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(createdKey.key, "API key")}
              >
                <Copy />
                Copy
              </Button>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-900">
                  MCP configuration
                </span>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(
                      buildMcpConfig(organization.id, createdKey.key),
                      "MCP config"
                    )
                  }
                >
                  <Copy />
                  Copy config
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-sm border border-emerald-200 bg-white px-3 py-2 font-mono text-xs text-slate-900">
                {buildMcpConfig(organization.id, createdKey.key)}
              </pre>
            </div>
            <div>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setCreatedKey(null)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden border border-slate-200 bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.isLoading ? (
                <TableRow>
                  <TableCell className="text-slate-500" colSpan={5}>
                    Loading API keys...
                  </TableCell>
                </TableRow>
              ) : keys.length === 0 ? (
                <TableRow>
                  <TableCell className="text-slate-500" colSpan={5}>
                    No API keys yet.
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium text-slate-900">
                      {apiKey.name}
                    </TableCell>
                    <TableCell className="font-mono text-slate-600">
                      {apiKey.keyPrefix}…
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {apiKey.createdByName}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        type="button"
                        variant="ghost"
                        onClick={() => revokeApiKey.mutate(apiKey.id)}
                      >
                        <Trash2 />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
