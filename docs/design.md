# Design Notes

## Create Organization Split Panel

The create organization flow uses a full-page split layout:

- left panel: setup form, progress label, user actions, and validation/errors
- right panel: non-interactive branded background effect with short contextual
  copy

The form side should remain sparse and operational. Use white panels on
`bg-slate-50`, slate text, blue accents, and amber only for non-blocking lookup
warnings. The lookup loading state should be calm and concrete: explain that
Plyco is reading public website and policy pages, and avoid implying automatic
compliance or legal certainty.

Each step should collect the minimum viable setup data and make lookup-prefilled
values obviously editable. The provider step should use the existing provider
catalog selector instead of a custom provider UI.
