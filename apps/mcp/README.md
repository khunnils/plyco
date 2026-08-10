# @plyco/mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI
agents read-only access to a single Plyco organization's workspace data. It can
run as a hosted Streamable HTTP service or as a local stdio process.
Organization reads go through `@plyco/api-client`, shared with `@plyco/cli`.

## Hosted Streamable HTTP

The hosted server accepts organization-scoped connections at:

```text
https://mcp.plyco.example/organizations/<organization-id>/mcp
```

Requests must send an organization API key as a bearer credential. The Plyco
API independently verifies that the key belongs to the organization in the
endpoint URL.

Required environment variables:

| Variable | Description |
| --- | --- |
| `PLYCO_API_URL` | Base URL of the Plyco API. |
| `MCP_HOST` | Listen host; defaults to `0.0.0.0`. |
| `MCP_PORT` | Listen port; defaults to `4300`; `PORT` is also accepted for Cloud Run. |
| `MCP_ALLOWED_HOSTS` | Optional comma-separated hostname allowlist. |

Run it locally with:

```bash
PLYCO_API_URL=http://localhost:4100 pnpm --filter @plyco/mcp dev:hosted
```

Example client configuration:

```json
{
  "mcpServers": {
    "plyco": {
      "url": "https://mcp.plyco.example/organizations/your-organization-id/mcp",
      "headers": {
        "Authorization": "Bearer plyco_org_your_key_here"
      }
    }
  }
}
```

`GET /health` provides an unauthenticated health check. MCP connections are
stateless so the service can run across multiple Cloud Run instances.

## Local stdio

### Setup

1. In the Plyco client, open **Settings → API Keys** (owner only) and create a
   key. Copy the raw key — it is shown only once.
2. Configure your MCP client with the API URL, that key, and your organization
   ID.

### Configuration

The server is configured through environment variables:

| Variable | Description |
| --- | --- |
| `PLYCO_API_URL` | Base URL of the Plyco API, e.g. `https://api.plyco.example`. |
| `PLYCO_API_KEY` | A per-organization API key (`plyco_org_…`). |
| `PLYCO_ORGANIZATION_ID` | The organization the key belongs to. |

### Example `mcp.json`

```json
{
  "mcpServers": {
    "plyco": {
      "command": "npx",
      "args": ["-y", "@plyco/mcp"],
      "env": {
        "PLYCO_API_URL": "https://api.plyco.example",
        "PLYCO_API_KEY": "plyco_org_your_key_here",
        "PLYCO_ORGANIZATION_ID": "your_organization_id"
      }
    }
  }
}
```

To run directly from a checkout instead of a published package:

```json
{
  "mcpServers": {
    "plyco": {
      "command": "pnpm",
      "args": ["--dir", "/path/to/plyco", "--filter", "@plyco/mcp", "exec", "tsx", "src/index.ts"],
      "env": {
        "PLYCO_API_URL": "https://api.plyco.example",
        "PLYCO_API_KEY": "plyco_org_your_key_here",
        "PLYCO_ORGANIZATION_ID": "your_organization_id"
      }
    }
  }
}
```

## Tools

All tools are read-only and scoped to the configured organization:

- `get_organization_overview` — organization profile snapshot.
- `get_company_profile` — company profile.
- `get_services` — services.
- `get_data_types` — stored data types.
- `get_activities` — business activities.
- `get_privacy_profile` — privacy profile.
- `get_infrastructure_profile` — infrastructure profile.
- `get_security_profile` — security profile.
- `get_access_profile` — access profile.
- `get_organization_providers` — provider inventory.
- `get_service_provider_usage` — service provider usage by service.
- `get_recommendations` — advisor recommendations.
- `get_vocabulary` — controlled vocabulary code sets.
- `list_templates` — document templates.
- `list_documents` — generated document summaries.
- `get_document` — a generated document, including its rendered markdown.

## Development

```bash
pnpm --filter @plyco/mcp build
pnpm --filter @plyco/mcp test
```
