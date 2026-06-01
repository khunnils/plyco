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
warnings. The lookup loading state should be calm and concrete: explain that
Plyco is reading public website and policy pages, and avoid implying automatic
compliance or legal certainty.

Each step should collect the minimum viable setup data and make lookup-prefilled
values obviously editable. Primary regions and compliance goals should use the
shared vocabulary code IDs so onboarding choices align with the rest of the
profile.
