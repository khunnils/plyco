# Product Spec

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
  activities

Final submit creates the organization, creates all onboarding activities, links
them to the primary service, saves all onboarding data types in the seeded
security profile, adds selected providers to organization inventory, and then
opens the workspace. Provider selections do not create service-specific provider
usage during setup.

## Activities and Data Types

In the workspace, each processing activity can reference the organization data
types it processes. This mapping is maintained from the Activities page after
organization creation; the onboarding review keeps activities and data types as
separate simple lists.

## Product and Data Graph

The workspace includes a read-only Product and Data graph at `/company/graph`.
It maps the organization to services, linked processing activities, data types
processed by those activities, data types processed through service provider
usage, and the providers used by those services. Users can pan and zoom the
graph, but cannot edit nodes or relationships from this view.
