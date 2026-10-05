# Design Notes

## Fictional Startup Demo

Brieflane uses a clean SaaS layout with its own self-hosted Manrope sans-serif,
white surfaces (`#ffffff`), charcoal text and primary actions (`#242329`), and
restrained violet accents (`#61518e`, pale tint `#eeebf5`). Do not use lime or
Plyco's Satoshi/Clash Grotesk pairing and slate/blue theme here.

The landing page has a centered headline and actions above an unframed product
preview, followed by six features, the two service descriptions, and a comparison
table. Comparison products and capabilities are explicitly fictional, with text
values rather than an all-checkmarks treatment. The table scrolls horizontally
on small screens and its scroll region is keyboard focusable. Company data
processing details use a native disclosure to keep the page concise while
preserving the facts in its HTML.

Product previews use responsive HTML and CSS with synthetic records: agency
navigation, a project queue, selected brief, file versions, and client activity.
On narrow screens the sidebar disappears and the selected request stacks above
its detail; other requests remain available at larger widths. Preview controls
are display-only. All pages retain a visible fictional-demo banner and a footer
distinguishing the static demo from the invented product. Security gaps use calm
amber callouts. Product facts and privacy disclosures remain crawlable HTML.

## Create Organization Centered Wizard

The create organization flow uses a full-page centered wizard layout:

- top bar: back navigation, organization setup title, progress label, progress
  bar, help affordance, and close/logout action
- centered panel: one focused setup task per step, validation/errors, and footer
  actions
- page background: subtle brand-colored frame and pattern with white panels

The form side should remain sparse and operational. Use white panels on
`bg-slate-50`, slate text, blue accents, and amber only for non-blocking lookup
warnings. Ask for organization identity, primary regions, and compliance goals
before starting lookup. The website lookup loading screen should use the title
“Building an understanding”; the privacy policy lookup loading screen should use
“Evaluating existing policies”. Both states should be calm and concrete: explain
that Plyco is reading public website or policy pages, and avoid implying
automatic compliance or legal certainty.

Each step should collect the minimum viable setup data and make lookup-prefilled
values obviously editable. Primary regions and compliance goals should use the
shared vocabulary code IDs so onboarding choices align with the rest of the
profile. The final service setup review should use tabs for the editable primary
service, data types, and activities. During onboarding, service setup should
collect service name, description, URL, and hosting region; data types should
collect name and description; activities should collect name and purpose. Richer
metadata remains available later in the company sections.
