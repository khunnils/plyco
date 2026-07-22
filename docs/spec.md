# Product Spec

## Marketing Site and Waitlist

The public Astro site explains Plyco as a lightweight compliance-readiness workspace for early-stage startups. Its early-access form collects an email and an optional compliance blocker for the private-beta waitlist. Accepted submissions receive an inline confirmation; no confirmation email is sent. Legitimate submissions also create or update a Resend contact with `source=waitlist` and `notes` set to the submitted blocker, then add the contact to the `Plyco - Waitlist` segment.

Public copy must stay concrete about website and policy analysis: imported values are editable starting points, not guaranteed compliance or legal conclusions.

## Security Profile

The Company workspace includes a Security profile after Infrastructure.
Security contains Development Security, Vulnerability Detection, Vulnerability
Remediation, and Incident Response. Development Security records whether code
review, dependency monitoring, secret scanning, automated pre-deployment tests,
CI/CD deployments, and production deployment approval are required.

Incident Response allows multiple customer notification methods, such as email
and a public status page. The last-tested date remains optional and does not
affect workspace completion or the needs-attention state.

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

Activities also record whether AI is used. When an activity uses AI, the
workspace captures free-text AI use cases plus whether customer data is used for
training, whether customer data is sent to AI providers, whether AI outputs get
human review, and whether users are informed when AI is used.

Infrastructure Providers include AI providers as a multi-select provider
category. Users can select multiple AI providers or explicitly answer that no AI
provider is used.

## Vocabulary Selectors

Workspace editors use searchable selectors for controlled vocabulary fields.
Code sets marked `Uses Hints` show each code's description beneath its label in
the dropdown while selected values remain compact. Organization-owned code sets
offer an in-context editor for adding, renaming, describing, activating,
deactivating, and removing codes without leaving the current page. System code
sets remain read-only.

## Service Cookies

The General panel in Service details records whether the service uses cookies or
similar tracking technologies. The dedicated Cookies tab is shown only when
this answer is Yes.
The category panel always presents the four fixed categories—Necessary,
Preferences, Analytics, and Marketing—in a responsive two-column card layout.
Each category has an autosaving enabled switch. Enabled cards also show an
autosaving Requires consent checkbox. Necessary defaults to no consent; the
other three categories default to requiring consent, and users may override the
default.

The Cookie Consent panel is always visible on the tab. Until a category requires
consent it displays explanatory placeholder text instead of fields. When consent
is required, the panel asks whether non-essential cookies are blocked until
consent, which consent mechanism is used, how consent can be withdrawn, and
whether Global Privacy Control is supported. These consent answers are cleared
when cookies are disabled or no configured category requires consent. Do Not
Track, equal-rejection, and pre-ticked-box questions are not collected.

The workspace Settings area is opened from the settings button at the bottom of
the sidebar. Settings contains General, Vocabulary, API Keys, and MCP Server
tabs. General shows current members to all members. Owners can invite people by
email as either member or owner, cancel pending invitations, change member
roles, remove
members, and delete the organization after confirming its name. Members can edit
workspace data but cannot manage the team or delete the organization. Invitation
links require Google or magic-link sign-in with the invited email before the
user is added to the organization.

The API Keys tab is owner-only; non-owners see a notice instead of the
management UI. Owners create a named key, and the full secret is shown exactly
once at creation; afterwards only the name, a short prefix, the creator, and the
creation date are shown. Keys grant read-only access to that organization's data
and can be revoked at any time. They are intended for AI agents connecting
through the Plyco MCP server.

The MCP Server tab shows a ready-to-paste configuration snippet prefilled with
the API URL and organization ID. Its API key remains an explicit placeholder
because raw keys are not persisted and cannot be retrieved after creation.

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
link to the Recommendations page. The sidebar shows Recommendations directly
below Dashboard.

The Recommendations page at `/recommendations` shows only active, unsuppressed
failing rules, grouped from critical to low severity. Passing rules, rules with
missing data, contextually not-applicable rules, and suppressed rules are not
shown in the prioritized list. Each recommendation presents the finding,
category, applicable framework codes, and an expandable recommended action.
Suppressed rules can be restored from a compact management popover. `/rules`
redirects to `/recommendations`.

Any organization member can suppress a recommendation when its underlying rule
is irrelevant to the organization. Suppressions are persisted and exclude the
rule from recommendations, severity counts, readiness coverage, and readiness
scores.

Advisor findings cover privacy, services, access, infrastructure, security,
processing activities, data consistency, and providers. Rules with no framework
are baseline checks. Framework-specific rules appear only when the organization
has selected a matching compliance goal; contextual applicability is evaluated
separately inside that goal scope.

Rules only evaluate answered values. `null`, missing values, and empty strings
are unanswered and cannot cause a recommendation. Explicit `false`, zero, code
values, and lists—including an explicitly empty list—are answered values. A
grouped rule waits until every scalar answer it uses is available. For
collection rules, incomplete records are ignored while complete records remain
eligible for evaluation.

The dashboard leads with workspace completion rather than a readiness score.
It shows overall setup progress and completed-versus-total details for Profile,
Privacy, Access, Infrastructure, and Security. Numeric readiness scores and
score progress bars are not shown on the dashboard.

In-progress dashboard section cards expose a shadcn popover from their status
indicator on hover or activation. The popover summarizes incomplete subsections
and their captured-fact counts without listing individual fields or advisor
findings.

Privacy, Access, Infrastructure, and Security show a qualitative readiness
label only after the area is complete, at least one advisor check applies, and
every applicable check has been assessed. Product & Data shows one pooled label
only after at least one service, activity, and data type exists; all of those
records and every existing vendor record are complete; and every applicable
pooled check has been assessed. Having no vendors does not block this label.
Hovering or activating a readiness label opens a popover with non-zero
recommendation counts by severity for that area in a single column. Selecting a
severity count drills into that severity's failing advisor checks.

The dashboard recommendations card uses a static "Recommendations" header that
links to the Recommendations page. Severity counts still reflect the current
recommendation set even when setup or advisor coverage is incomplete.

Product & Data readiness pools the Activities, Data, Services, and Vendors rule
categories. Critical, high, medium, and low checks contribute weights of 8, 4,
2, and 1. Scores use assessed checks only and retain assessed-versus-applicable
coverage in the recommendations API. The overall score pools all assessed rule
weights. These scores are live readiness signals, not audit or certification
results, and are not persisted or historically tracked.
