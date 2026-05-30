# Product Spec

## Create Organization Flow

New users create an organization from a split-panel setup flow. The left panel
contains the active form step and the right panel provides a calm branded
background effect.

The first step asks for organization name and website URL. The client calls the
authenticated `POST /organization-lookup` endpoint, which attempts to prefill
setup from the public website. While lookup runs, the client shows an interim
state explaining that Plyco is reading website and policy details. Lookup
failure is not blocking; the user continues with the entered name and URL.

After lookup, the user reviews five editable steps:

- organization profile: legal entity name, country, contact email, and address
- primary service: name, description, and primary hosting region
- primary data: one starting data type, with additional data types added later
- primary activity: one starting business activity
- provider selector: optional provider catalog selections

Final submit creates the organization, creates the primary activity, saves the
seeded security profile, adds selected providers to organization inventory, and
then opens the workspace. Provider selections do not create service-specific
provider usage during setup.
