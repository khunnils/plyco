# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Plyco client application. `posthog-js` and `@posthog/react` were installed and initialised in `src/main.tsx` with `PostHogProvider` and `PostHogErrorBoundary` wrapping the entire app. User identification runs in `App.tsx` whenever the authenticated user first becomes available, and `posthog.reset()` is called on logout via `use-auth.ts`. Fifteen events covering the full product lifecycle — from sign-in through onboarding, vendor management, activity tracking, document publishing, and recommendation engagement — were instrumented across eleven files.

| Event                                  | Description                                                                                    | File                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `user_signed_in`                       | Fires when an authenticated user is first detected on the client, identifying them in PostHog. | `src/App.tsx`                                                          |
| `magic_link_sent`                      | Fires when a user submits the email form to request a magic link sign-in.                      | `src/features/auth/components/login-screen.tsx`                        |
| `organization_created`                 | Fires when the onboarding wizard finishes and a new organization is successfully created.      | `src/features/organizations/onboarding/components/review-step.tsx`     |
| `onboarding_compliance_goals_selected` | Fires when the user advances past the compliance goals step during onboarding.                 | `src/features/organizations/onboarding/components/compliance-step.tsx` |
| `vendor_added_from_catalog`            | Fires when one or more providers are added from the provider catalog.                          | `src/features/vendors/pages/vendors-route-page.tsx`                    |
| `vendor_added_manually`                | Fires when a new vendor is manually created via the custom vendor form.                        | `src/features/vendors/pages/vendors-route-page.tsx`                    |
| `vendor_updated`                       | Fires when an existing vendor's details are saved after editing.                               | `src/features/vendors/pages/vendors-route-page.tsx`                    |
| `vendor_deleted`                       | Fires when a vendor is removed from the organisation.                                          | `src/features/vendors/pages/vendors-route-page.tsx`                    |
| `activity_created`                     | Fires when a new business activity is successfully created.                                    | `src/features/company/activities/pages/activities-route-page.tsx`      |
| `activity_updated`                     | Fires when an existing business activity is updated and saved.                                 | `src/features/company/activities/pages/activities-route-page.tsx`      |
| `activity_deleted`                     | Fires when a business activity is deleted.                                                     | `src/features/company/activities/pages/activities-route-page.tsx`      |
| `document_published`                   | Fires when a policy document is generated (published) from a template.                         | `src/features/documents/pages/documents-route-page.tsx`                |
| `document_pdf_downloaded`              | Fires when a user downloads a generated policy document as a PDF.                              | `src/features/documents/pages/documents-route-page.tsx`                |
| `security_profile_saved`               | Fires when the user saves their security profile during the legacy onboarding flow.            | `src/features/shell/components/onboarding.tsx`                         |
| `recommendation_expanded`              | Fires when a user expands a recommendation to read its recommended action.                     | `src/features/recommendations/components/recommendations-list.tsx`     |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behaviour, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/476941/dashboard/1742563)
- [Onboarding Conversion Funnel](https://us.posthog.com/project/476941/insights/sIfAWDvY)
- [New Organizations Over Time](https://us.posthog.com/project/476941/insights/y3x7Kh3n)
- [Vendor Management Activity](https://us.posthog.com/project/476941/insights/xRopr6yt)
- [Document Publishing & PDF Downloads](https://us.posthog.com/project/476941/insights/JacZj3Xb)
- [Core Feature Engagement](https://us.posthog.com/project/476941/insights/zv9DAWAk)

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current handler in `App.tsx` uses a ref to identify only once per session, but verify that a hard refresh or a new tab re-identifies the user correctly.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
