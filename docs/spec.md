# ComplyFlow MVP PRD

## Product Overview

ComplyFlow is a lightweight security readiness workspace for early-stage startups preparing for enterprise customers, security reviews, and future compliance initiatives.

The product helps startups avoid “compliance debt” by organizing operational security controls, evidence, vendors, policies, and security documentation before enterprise security requirements become blockers.

# Product Vision

Help startups build enterprise trust before compliance becomes a growth blocker.

# Core Product Principles

## 1. Security readiness first

The product models operational security posture, not audit bureaucracy.

## 2. Shared controls

Controls are operational controls mapped to frameworks.

Users interact with:

- controls
- evidence
- tasks
- vendors
- policies

NOT:

- framework bureaucracy
- audit terminology

## 3. Structured source-of-truth

Security documentation is generated from structured operational data.

Policies are not standalone documents.

## 4. Lightweight and approachable

The product should feel:

- practical
- founder-friendly
- operational

NOT:

- enterprise-heavy
- legalistic
- cybersecurity theater

# MVP Scope

The MVP includes:

1. Security Program Snapshot
2. Shared Security Controls
3. Evidence Collection
4. Vendor Inventory
5. Policy Generation
6. Security Summary Generation
7. Readiness Dashboard
8. Document Templates
9. Generated Documents

# Core MVP Features

# 1. Security Program Snapshot

## Goal

Provide a structured overview of the startup’s operational security posture.

This becomes:

- onboarding foundation
- source-of-truth security profile
- input for policy generation
- input for security summaries
- questionnaire answer source

## UX

Multi-step onboarding/workspace experience.

Users answer practical operational questions.

Avoid giant forms or audit-style questionnaires.

Users sign in with Google and can belong to multiple organizations. The client lets users choose the current organization from the workspace sidebar, and all workspace data is loaded through organization-scoped API routes. Organization membership controls access; v1 stores `owner` and `member` roles, with both roles able to edit the security snapshot and related workspace data.

Controlled choices such as industries, regions, compliance goals, data categories, data purposes, collection methods, legal basis, DPA status, data processing level, vendor category, vendor criticality, and provider system type are stored as stable code IDs. System code sets are loaded from Airtable with `pnpm plyco codes load`; organization-editable code sets are cloned during onboarding and managed from the Vocabulary screen. Countries use app-owned ISO alpha-2 country codes from a separate countries reference table.

## Sections

### Company Profile

Fields:

- company name
- employee count
- industries
- regions
- country
- handles PII
- handles sensitive data
- compliance goals

### Infrastructure Profile

Fields:

- organization providers for cloud, source control, auth, and password management systems
- MFA enabled
- encrypted devices required
- backups enabled
- centralized logging enabled

### Data Handling Profile

Fields:

- data types stored, captured as name, sensitivity, and description entries
- stores PII
- stores healthcare data
- encryption at rest
- encryption in transit
- production data in development
- retention policy exists

### Access Control Profile

Fields:

- MFA required
- SSO enabled
- shared accounts exist
- offboarding process exists
- access reviews performed
- privileged access restricted

### Vendor & Subprocessor Profile

Fields:

- vendor inventory
- country of registration
- vendor category
- data processing level
- subprocessors
- DPA status
- data regions
- criticality

### Vocabulary

The app includes a Vocabulary sidebar option. Organization users can add, remove, rename, and deactivate codes in organization-owned vocabulary sets. System code sets and countries are not editable from the Vocabulary screen.

# 2. Shared Security Controls

## Goal

Provide a curated startup security readiness baseline.

Controls represent operational security practices.

Controls are mapped to frameworks secondarily.

## Control Categories

- Access Control
- Endpoint & Device Security
- Data Protection
- Incident Response
- Vulnerability Management
- Secure Development
- Vendor Security
- Security Awareness
- Risk Management

## Control Model

Each control contains:

- id
- title
- description
- why it matters
- category
- suggested evidence
- priority
- suggested policy
- SOC 2 mappings
- control type
- maturity level

## Example Control

```text
MFA required for critical systems

Why this matters:
Reduces account compromise risk.

Evidence:
- Google Workspace screenshot
- GitHub MFA enforcement screenshot
```

# 8. Document Templates

## Goal

Provide reusable markdown templates for security documents and customer-facing policy drafts.

System templates are versioned markdown files in the repository. Each file starts with basic metadata:

```text
' slug: template-slug
' name: template name
' description: template description
```

Template content uses Jinja-style placeholders such as `{{ company.name }}`.

## UX

The app includes a Templates sidebar option.

The Templates screen shows:

- System templates at the top, with slug, name, description, and an Add action.
- Organization templates below, created by copying a system template.

Organization templates can be edited or deleted after they are added. Editing covers name, slug, and markdown content.

# 9. Generated Documents

## Goal

Generate stored markdown documents from organization templates and the current security profile source-of-truth.

Documents are generated through:

```text
Report Context Builder
→ Normalized Template Context
→ Jinja-style Renderer
→ Generated Document
```

Generated documents retain a source hash so the app can show when a document is outdated after template or profile changes. Each generated document also has a private PDF export that can be downloaded through the authenticated app.

## UX

The app includes a separate Documents sidebar option.

The Documents screen shows one row per organization template:

- templates with no document use an outline ghost style and show Generate
- generated documents show View
- generated documents with a PDF export show Download
- outdated generated documents show an Outdated badge and View

Generated documents are read-only in this version.
