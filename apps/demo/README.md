# Brieflane demo startup

An independent static Astro site for Plyco onboarding, testing, and demos.
Production address: `https://plyco-demo.web.app/`. Brieflane, its people, company
details, contacts, product controls, and provider configuration are fictional.

## Run locally

Use Node.js 22.12 or later and the workspace's pnpm version. From the repository
root:

```sh
pnpm install --frozen-lockfile
pnpm dev:demo
```

Open [http://localhost:4400/](http://localhost:4400/). The development server
reloads when you edit the site. Stop it with `Ctrl+C`. If port 4400 is occupied,
use the URL printed by Astro.

The demo runs independently; no API, database, environment variables, or
Firebase login is required. Local pages include
[Workspace](http://localhost:4400/workspace/),
[Customer Portal](http://localhost:4400/portal/),
[Privacy](http://localhost:4400/privacy/), and
[Security](http://localhost:4400/security/).

Plyco's AI website lookup needs a publicly reachable URL; localhost is suitable
for viewing and editing the demo, but not for remote onboarding analysis. Use
the deployed demo URL for that walkthrough.

## Validate and preview a production build

From the workspace root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @plyco/demo typecheck
pnpm --filter @plyco/demo build
```

To serve the built static output locally:

```sh
pnpm --filter @plyco/demo preview --port 4400
```

Open [http://localhost:4400/](http://localhost:4400/). Rebuild after changing
source files; this preview serves `dist` rather than watching the source.
The implementation checks do not require a browser or end-to-end tests.

Routes: `/`, `/workspace/`, `/portal/`, `/privacy/`, and `/security/`.
Shared scenario facts live in `src/content/company.ts`. Keep the prose and
provider assumptions consistent when changing that scenario. The site uses
self-hosted Manrope sans-serif and a white-and-charcoal palette with restrained violet accents,
intentionally distinct from `apps/web`. The font license is in `public/fonts/OFL.txt`.
The responsive HTML product illustration presents a request queue, project brief,
file versions, and client feedback; its controls remain display-only. The landing page includes six features and a
clearly labeled fictional competitor comparison. Business data details remain
in the page HTML inside an expandable disclosure.

This package uses TypeScript 6 for `astro check`: Astro's language server needs
the JavaScript compiler API, which the workspace's TypeScript 7 native compiler
does not expose. Other packages retain their existing TypeScript version.

All pages have `noindex, follow` metadata and deployment headers; `robots.txt`
allows retrieval for direct URL analysis. There are no SPA fallback rewrites,
client scripts, forms, authentication, or real uploads. Preview controls are
noninteractive labels. The demo has no analytics or application cookies;
Firebase infrastructure may process access logs. The `.example` contacts are
not deliverable. The fictional application's AWS residency claims do not
describe the actual demo's Firebase deployment.

## Deploy

Hosting target `demo` maps to Firebase site `plyco-demo` in project
`plyco-prod`, served at `https://plyco-demo.web.app/`.

`.github/workflows/deploy-demo.yml` typechecks, builds, and deploys that
target when demo files change on `main`, and on manual dispatch. It uses the
production environment, the `FIREBASE_DEPLOY_SERVICE_ACCOUNT_JSON` secret, and
the `FIREBASE_PROJECT_ID` variable (default `plyco-prod`).

To deploy the same target by hand:

```sh
pnpm --filter @plyco/demo typecheck
pnpm --filter @plyco/demo build
firebase deploy --only hosting:demo --project plyco-prod
```

After deployment, verify all routes and the index header over HTTP:

```sh
curl --fail --location --head https://plyco-demo.web.app/
curl --fail --location https://plyco-demo.web.app/workspace/
curl --fail --location https://plyco-demo.web.app/portal/
curl --fail --location https://plyco-demo.web.app/privacy/
curl --fail --location https://plyco-demo.web.app/security/
```

Confirm status 200, `X-Robots-Tag: noindex, follow`, and the expected page
contents.

## Manual Plyco onboarding walkthrough

1. Create an organization named **Brieflane** with website
   `https://plyco-demo.web.app/`. Select EU and US regions and the GDPR goal.
2. Let website and privacy-policy lookup complete. Review suggestions rather
   than accepting them as a guaranteed or exact fixture output. Website lookup
   currently imports only one primary service and at most five suggested data
   types and five activities; it does not import every regional hosting detail.
3. Check company identity against **Brieflane Labs Limited**, Ireland, the
   fictional Dublin address, and the three `.example` contact addresses.
   Verify B2B SaaS for agencies, EU/US customers, personal data handling, and no
   intended sensitive or health data.
4. Check that the primary service is **Brieflane Workspace**: agency request,
   document, and approval management. The service URL may initially be the
   landing-page URL; update it to `https://plyco-demo.web.app/workspace/` in review.
   Choose Ireland/EU as this walkthrough's hosting region (US is a separate
   supported customer choice).
5. Expected data categories are business-user accounts, client contact
   details, requests/documents, approval records, and usage/security logs.
   Expected activities are account/client access management, request/document
   management, recording approvals, service notifications, and service
   monitoring/support. Wording and grouping may vary with AI extraction.
6. Verify the discovered policy is `https://plyco-demo.web.app/privacy/`. Expected
   privacy facts include rights requests by email, 30-day response target
   within one calendar month, identity verification, authorized representatives,
   internal review of refusals, transactional and consent-based marketing
   emails, cross-border transfers with SCCs, documented retention, no sale or
   advertising sharing, no significant automated decisions, and no production
   customer data in development. No statutory DPO or separate EU representative
   is appointed in this scenario.
7. Complete organization setup. It creates the primary service and fixed
   **Marketing website** service. Add **Brieflane Customer Portal** manually
   with URL `https://plyco-demo.web.app/portal/`, customer-data processing enabled,
   and the same EU hosting region. Link account/client access, requests,
   approvals, notifications, and security logging as appropriate to both
   services and the data types they process.
8. Add or confirm AWS, Stripe, and Resend in the vendor inventory; onboarding
   suggestions may not include every provider. Record service-specific usage
   manually: AWS for Workspace/Portal compute, storage, and backups; Resend for
   minimal notification data; Stripe for company subscription billing without
   project files. The real Marketing website is hosted on Firebase, not AWS.
9. Use the service editors, Product and Data graph, Recommendations, and
   document generation to demonstrate the modeled business. Record the pending
   incident exercise and penetration test manually where applicable. Website
   lookup does not automatically populate the complete security profile.

All imported values are editable starting points. This is a demo walkthrough,
not an assertion that the fictional business is legally compliant. Never upload
real customer data to these static previews.
