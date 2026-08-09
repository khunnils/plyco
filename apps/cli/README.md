# @plyco/cli

Read-only command-line client for querying a Plyco organization's workspace
data. Designed for scripts and AI agents that prefer shell commands over MCP.

## Setup

1. In the Plyco client, open **Settings → API Keys** (owner only) and create a
   key. Copy the raw key — it is shown only once.
2. Set the API URL, that key, and your organization ID.

## Configuration

| Variable / flag | Description |
| --- | --- |
| `PLYCO_API_URL` / `--api-url` | Base URL of the Plyco API |
| `PLYCO_API_KEY` / `--api-key` | Organization API key (`plyco_org_…`) |
| `PLYCO_ORGANIZATION_ID` / `--org` | Organization the key belongs to |

Flags override environment variables.

## Install

```bash
npx -y @plyco/cli --help
# or
npm install -g @plyco/cli
```

From a checkout:

```bash
pnpm --filter @plyco/cli exec tsx src/index.ts --help
```

## Examples

```bash
export PLYCO_API_URL=https://api.plyco.example
export PLYCO_API_KEY=plyco_org_your_key_here
export PLYCO_ORGANIZATION_ID=your_organization_id

plyco overview
plyco profile
plyco documents list
plyco documents get <documentId>
```

All commands write JSON to stdout.

## Commands

- `overview` — organization profile snapshot
- `profile` / `services` / `data-types` / `activities`
- `privacy` / `infrastructure` / `security` / `access`
- `providers` / `service-provider-usage`
- `recommendations` / `vocabulary`
- `templates list`
- `documents list` / `documents get <documentId>`

## Agent usage

Point a coding agent at the binary and the same env vars used by `@plyco/mcp`.
Prefer MCP when the host supports it; use this CLI for shell pipelines and
agents that invoke subprocess commands.

## Development

```bash
pnpm --filter @plyco/cli build
pnpm --filter @plyco/cli test
```
