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

Sprint 1 starts with a single organization and no login. The saved snapshot is the current workspace source-of-truth until auth and membership are introduced in a later sprint.

## Sections

### Company Profile

Fields:
- company name
- employee count
- industries
- regions
- handles PII
- handles sensitive data
- compliance goals

### Infrastructure Profile

Fields:
- cloud providers
- source control provider
- auth provider
- password manager
- MFA enabled
- encrypted devices required
- backups enabled
- centralized logging enabled

### Data Handling Profile

Fields:
- data types stored
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
- subprocessors
- DPA status
- data regions
- criticality

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
