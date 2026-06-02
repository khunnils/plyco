# Design Notes

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
