# plyco MVP PRD

## Product Overview

plyco is a lightweight security readiness workspace for early-stage startups preparing for enterprise customers, security reviews, and future compliance initiatives.

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
8. Policies & Documents

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

Controlled choices such as industries, regions, compliance goals, service user types, service customer types, cookie/tracking categories, privacy supported rights, privacy request methods, privacy cookie consent mechanisms, privacy marketing opt-out methods, privacy transfer mechanisms, security cadences, security encryption algorithms, TLS versions, key management providers, monitoring owners, notification timelines, customer notification processes, data categories, data purposes, activity role, collection methods, legal basis, DPA status, data processing level, vendor category, vendor criticality, and provider system type are stored as stable code IDs. System code sets are loaded from Airtable with `pnpm plyco codes load` using tables named **Code Sets** and **Codes**: each code set row must expose a stable machine id in **`Id`** or **`Key`**, and each option must be its own row in **Codes** with a link back to that code set (multi-select tags on the code-set row are not imported). Codes may expose **`Sequence`**, **`Sort Order`**, **`Sort`**, or **`Order`** to control dropdown order; ties are shown alphabetically. Organization-editable code sets are cloned for each organization when first needed and managed from the Vocabulary screen; missing sets or codes introduced after the initial clone are added automatically when vocabulary is loaded again unless the organization explicitly removed that code. Countries use app-owned ISO alpha-2 country codes from a separate countries reference table.

The Plyco tool can resolve provider details from a provider URL with `pnpm plyco providers lookup --url <url>`. It can also import the resolved provider into Airtable with `pnpm plyco providers import --url <url>`, upserting the matching provider organization and provider rows. Lookup uses the current Airtable vendor category and provider system type code IDs and does not create or update app records; import writes only to Airtable.

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

### Service Profiles

The workspace supports multiple product or service profiles per organization. The sidebar opens a Services selector page that lists available services and key context without inline edit controls, while still offering an Add service action. Selecting a service opens the attached service profile, which is organized into editable panels for basics, audience and availability, service privacy, and vendors. New services start with only basic details before users fill out the remaining service panels. Services are not part of onboarding. Service-specific cookie, tracking, hosting, and vendor-use details live on each service. Organization-level profile sections such as shared Privacy rights, Infrastructure, Data Handling, and Access stay shared across services.

Fields:

- service name
- service description
- service URL
- business activities performed by the service
- user types
- customer types
- availability regions
- children-directed indicator
- minimum user age, where `0` means unset
- uses cookies or tracking technologies
- cookie / tracking categories
- cookie consent mechanism
- Do Not Track response
- Global Privacy Control supported
- analytics providers selected from provider catalog entries tagged as `analytics`
- advertising providers selected from provider catalog entries tagged as `advertising`
- primary hosting region

### Privacy Profile

The workspace includes organization-level privacy rights and request handling details. It is edited from the Company workspace navigation and is not part of onboarding.

Fields:

- supported rights
- request methods
- response timeline status
- response timeline days, where `0` means unset
- identity verification required
- authorized agent supported
- appeal process exists
- sends marketing emails
- marketing opt-out method
- transactional emails sent
- newsletter provider selected from provider catalog entries tagged as `newsletter`
- cross-border transfers
- transfer mechanisms
- privacy officers and representation, shown when GDPR is selected as a compliance goal

### Infrastructure Profile

Fields:

- organization providers for cloud, source control, auth, and password management systems
- MFA enabled
- encrypted devices required
- backups enabled
- centralized logging enabled
- encryption algorithm, TLS version, and key management provider
- log retention and security monitoring owner
- vulnerability scanning cadence and patching SLAs
- incident response plan, notification timeline, customer notification process, and last tested date
- backup cadence, backup retention, and restore testing cadence
- vendor review requirement, review cadence, and DPA requirement for processors

### Data Handling Profile

Fields:

- data types stored, captured as free-text name, subject types, collection methods, sensitivity, and description entries
- stores PII
- stores healthcare data
- encryption at rest
- encryption in transit
- production data in development
- retention policy exists

### Access Control Profile

Fields:

- Multi-factor authentication (MFA) required
- Single sign-on supported
- shared accounts exist
- Employee offboarding process exists
- Periodic access reviews are performed
- least privilege
- role-based access
- access review cadence
- admin approval required
- password manager required

### Vendor & Subprocessor Profile

Fields:

- reusable vendor inventory managed from the Vendors page
- service-specific vendor use mappings managed from each service profile, with organization vendors selected in bulk and already-selected vendors shown disabled
- country of registration
- vendor category
- service-specific purpose
- service-specific data processing level
- subprocessors
- DPA status
- service-specific data regions
- criticality
- legal name and display name
- provider organization name and legal name
- privacy policy, DPA, and security page URLs

### Business Activities

Fields:

- activity name
- purpose
- role
- legal basis, shown when GDPR is selected as a compliance goal
- retention policy
- retention days
- services that perform the activity

Compliance-targeted fields are controlled by shared field metadata keyed by
stable field IDs and compliance goal code IDs. Hidden field values are retained
so users do not lose prior answers when compliance goals are toggled.

### Vocabulary

The app includes a Vocabulary sidebar option. Organization users can add, remove, rename, and deactivate codes in organization-owned vocabulary sets. Removed codes are hidden from organization vocabulary and are not automatically backfilled again from the source system vocabulary for that organization. System code sets and countries are not editable from the Vocabulary screen.

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

# 8. Policies & Documents

## Goal

Provide reusable markdown templates and generated customer-facing policy documents in one workspace.

System templates are versioned markdown files in the repository. Each file starts with basic metadata:

```text
' slug: template-slug
' name: template name
' description: template description
```

Template content uses Jinja-style placeholders such as `{{ company.name }}`.

## UX

The app includes a Policies & Documents sidebar option. The page shows organization templates only. If no organization templates exist, it shows an empty state with an Add action. Add opens a selector where users can copy available system templates or create a new organization template from scratch. Already-added system templates are shown as added and cannot be selected again.

Organization templates can be edited or deleted after they are added. Editing covers name, slug, per-template policy metadata, and markdown content. Organization templates created from scratch have no source system template.

The template editor includes a schema picker, markdown/Jinja content editor, and live preview. The schema picker is populated from the canonical template variable schema and groups available organization, service, privacy, security, and vendor fields by category. Users can click or drag variables into the editor. Scalar variables insert Jinja placeholders such as `{{ organization.name }}`. Collection variables insert loop snippets such as `{% for vendor in vendors.dataProcessors -%}` with an item placeholder and `{% endfor %}`. The live preview renders the unsaved draft template against the current organization state after a short typing pause. Previewing does not save the template, create a generated document, or create a PDF export.

Documents are generated from organization templates and the current security profile source-of-truth:

Documents are generated through:

```text
Report Context Builder
→ Normalized Template Context
→ Jinja-style Renderer
→ Generated Document
```

Generated documents retain a source hash so the app can show when a document is outdated after template, policy metadata, service context, privacy context, or profile changes. Each generated document also has a private PDF export that can be downloaded through the authenticated app.

The Policies & Documents page shows one row per organization template:

- templates with no document use an outline ghost style and show Generate
- generated documents show View
- generated documents with a PDF export show Download
- outdated generated documents show an Outdated badge and View
- each template row indicates whether a document has never been generated or was last generated on a specific date

Generated documents are read-only in this version.
