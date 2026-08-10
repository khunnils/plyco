---
name: plyco
description: Query and update a Plyco organization's security and compliance workspace via the `plyco` CLI. Use when the user mentions Plyco, or asks to read or edit their company profile, services, business activities, data types, privacy/infrastructure/security/access posture, service providers, controlled vocabulary, advisor recommendations, or generated compliance documents.
---

# Plyco CLI

Plyco is a security and compliance readiness workspace. The `plyco` CLI reads and updates a single organization's data. Every command prints JSON to stdout.

## Configuration

The CLI needs three values, from environment variables or flags (flags win):

| Environment variable | Flag | Description |
| --- | --- | --- |
| `PLYCO_API_URL` | `--api-url <url>` | Base URL of the Plyco API |
| `PLYCO_API_KEY` | `--api-key <key>` | Organization API key (`plyco_org_…`) |
| `PLYCO_ORGANIZATION_ID` | `--org <id>` | Organization the key belongs to |

Write commands require a key with the `read_write` scope. Read-only keys can only run read commands.

Run the CLI with `npx -y @plyco/cli <command>` (or `plyco <command>` if installed globally). Verify configuration with `plyco overview`.

## Read commands

All read commands print JSON and take no input:

- `overview` — organization profile snapshot
- `profile` — company profile
- `services` — organization services
- `data-types` — stored data types
- `activities` — business activities
- `privacy` / `infrastructure` / `security` / `access` — posture profiles
- `providers` — provider inventory
- `service-provider-usage` — provider usage records
- `recommendations` — advisor recommendations
- `vocabulary` — controlled vocabulary code sets
- `templates list` — document templates
- `documents list` — generated documents
- `documents get <documentId>` — a single generated document

## Write commands

Write commands take a JSON body from `--file <path>` or stdin. They print the updated resource as JSON.

Single-resource updates (full replace of that section):

- `profile update`
- `services update`
- `data update`
- `privacy update` / `infrastructure update` / `security update` / `access update`

Collection CRUD:

- `activities add` / `activities update <id>` / `activities remove <id>`
- `providers add` / `providers update <id>` / `providers remove <id>` / `providers resolve`
- `service-provider-usage add` / `service-provider-usage update <id>` / `service-provider-usage remove <id>`
- `vocabulary codes add <codeSetId>` / `vocabulary codes update <codeSetId> <codeId>` / `vocabulary codes remove <codeSetId> <codeId>`

`providers resolve` takes a URL in its JSON body and returns provider details without modifying data.

## Workflow: read before update

`update` commands replace the whole section, so fetch the current state first, edit it, then send it back. This avoids dropping fields.

```bash
plyco profile > profile.json
# edit profile.json
plyco profile update --file profile.json
```

Piping stdin works too:

```bash
echo '{"name":"Acme Analytics","category":"analytics"}' | plyco providers add
```

## Errors

On failure the CLI prints the error to stderr and exits with code 1. API errors are printed as JSON (the response body); other errors as a plain message. Check the exit code and read stderr when a command fails.
