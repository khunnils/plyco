# Product Spec

## Marketing Site and Waitlist

The public Astro site explains Plyco as a lightweight compliance-readiness workspace for early-stage startups. Its early-access form collects an email and an optional compliance blocker for the private-beta waitlist. Accepted submissions receive an inline confirmation; no confirmation email is sent.

Public copy must stay concrete about website and policy analysis: imported values are editable starting points, not guaranteed compliance or legal conclusions.

## Security Profile

The Company workspace includes a Security profile after Infrastructure.
Security contains Development Security, Vulnerability Detection, Vulnerability
Remediation, and Incident Response. Development Security records whether code
review, dependency monitoring, secret scanning, automated pre-deployment tests,
CI/CD deployments, and production deployment approval are required.

Infrastructure contains Monitoring & Detection. It records whether centralized
logging is enabled and whether security monitoring is none, manual, or
automated; log-retention duration and monitoring-owner fields are not collected.

## Create Organization Flow

New users create an organization from a split-panel setup flow. The left panel
contains the active form step and the right panel provides a calm branded
background effect.

The first step asks for organization name and website URL. The next steps ask
for primary regions and compliance goals before any public-page lookup runs.
After those choices, the client calls the authenticated
`POST /organization-lookup/website` endpoint and shows a blocking “Building an
understanding” loading screen while it attempts to prefill setup from the public
website. If that response includes a privacy policy URL, the client calls
`POST /organization-lookup/privacy-policy` and shows a separate blocking
“Evaluating existing policies” loading screen to enrich privacy defaults. Lookup
failure is not blocking; the user continues with the entered name, URL, selected
regions, selected goals, and editable manual defaults.

After lookup, the user reviews setup in two screens:

- company review: organization identity, selected regions, compliance goals,
  privacy policy, and suggested providers
- setup review: editable tabs for the primary service, data types, and
  activities, plus a visible fixed Marketing website service summary

Final submit creates the organization, creates the primary service and a
Marketing website service, creates all onboarding activities, links primary
activities to the primary service, links the fixed Operate marketing website
activity to the Marketing website service, saves all onboarding data types in
the seeded security profile, adds selected providers to organization inventory,
and then opens the workspace. The Marketing website service includes a fixed
Website visitor data type for basic visitor, analytics, and inquiry data.
Provider selections do not create service-specific provider usage during setup.
Compliance goal choices shown during onboarding come from the configured
vocabulary, including CCPA and ISO 27001 when present. Technology provider
selection happens on the dedicated provider step; those
manual selections are not repeated in setup review. Onboarding data types and
activities can be edited or deleted in review, but new rows are added later from
the workspace.

## Activities and Data Types

In the workspace, each processing activity can reference the organization data
types it processes. This mapping is maintained from the Activities page after
organization creation, except onboarding automatically links Operate marketing
website to Website visitor data so the default website service appears in the
Product and Data graph.

## Vocabulary Selectors

Workspace editors use searchable selectors for controlled vocabulary fields.
Code sets marked `Uses Hints` show each code's description beneath its label in
the dropdown while selected values remain compact. Organization-owned code sets
offer an in-context editor for adding, renaming, describing, activating,
deactivating, and removing codes without leaving the current page. System code
sets remain read-only.

The workspace Settings area is opened from the settings button at the bottom of
the sidebar. Settings contains Team and Vocabulary tabs. Team shows current
members to all members. Owners can invite people by email as either member or
owner, cancel pending invitations, change member roles, remove members, and
delete the organization after confirming its name. Members can edit workspace
data but cannot manage the team or delete the organization. Invitation links
require Google or magic-link sign-in with the invited email before the user is
added to the organization.

## Product and Data Graph

The workspace includes a read-only Product and Data graph at `/company/graph`.
It maps the organization to services, linked processing activities, data types
processed by those activities, data types processed through service provider
usage, and the providers used by those services. Users can pan and zoom the
graph, but cannot edit nodes or relationships from this view.

Workspace service, business-activity, and data-type lists can be reordered from
dedicated drag handles. A completed drop saves immediately for the organization,
and the persisted order is reused by selectors, graphs, generated documents, and
other downstream views. Dragging is disabled while an order update is pending;
failed updates restore the prior order and show an error.

## Smart Advisor Recommendations

The dashboard includes a Recommendations section with counts by severity and a
link to the full recommendations page. The sidebar shows Recommendations
directly below Dashboard.

The recommendations page at `/recommendations` lists current advisor findings
from the saved organization profile. Each item shows severity, category,
message, recommendation text, framework codes, and related profile fields. When
no rules match, the page shows “No recommendations right now.”

Recommendations are computed from static advisor rules and are not persisted,
dismissed, or assigned in this version.
