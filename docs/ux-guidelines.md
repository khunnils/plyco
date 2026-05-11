# UX Guidelines

## Product Positioning

We are building a lightweight compliance readiness platform for early-stage startups.

The product helps startups avoid **compliance debt** before it blocks pilots, enterprise sales, or future audits.

We are not building an enterprise GRC platform, a Vanta clone, or a fully automated compliance engine. The product should feel like a practical workspace that helps small teams do the right things early.

## Target User

Design primarily for:

- technical founders
- early-stage SaaS and AI startups
- small teams of 1–20 people
- teams preparing for first pilots, enterprise security reviews, SOC 2 readiness, or GDPR readiness
- founders who move fast but do not want to rebuild everything later

Assume users are busy, technical, skeptical of compliance fluff, and allergic to enterprise bloat.

## Core UX Principle

Make compliance feel manageable.

The product should reduce panic, ambiguity, and scattered work. Every screen should help the user answer:

- What do we need to do?
- Why does this matter?
- What is missing?
- Who owns it?
- What evidence do we already have?
- Are we becoming more ready?

## Product Personality

Use a tone that is:

- founder-to-founder
- plainspoken
- pragmatic
- calm
- credible
- slightly opinionated
- lightweight

Avoid:

- legalese
- enterprise jargon
- fear-based copy
- cybersecurity theater
- “AI-powered magic” language
- overpromising certification or audit outcomes

Preferred language:

- compliance readiness
- compliance debt
- pilot-ready
- SOC-ready
- audit-friendly
- lightweight structure
- startup operating hygiene
- evidence collection
- shared controls

Avoid saying:

- guaranteed compliance
- instant SOC 2
- fully automated audit
- continuous compliance platform
- enterprise-grade GRC

## Visual Direction

The interface should feel closer to Linear, Stripe, Basecamp, or a modern dev tool than a cybersecurity dashboard.

Design qualities:

- clean
- calm
- sparse
- structured
- trustworthy
- modern
- low-noise
- readable

Avoid:

- dark hacker themes
- shield/lock clichés everywhere
- neon cyber visuals
- corporate stock imagery
- dense enterprise dashboards
- red-alert-heavy UI

## Shared Tailwind Theme

Use the same base theme for landing page and app.

### Color Tokens

```css
:root {
  --background: #F8FAFC;
  --foreground: #0F172A;

  --card: #FFFFFF;
  --card-foreground: #0F172A;

  --muted: #F1F5F9;
  --muted-foreground: #64748B;

  --border: #E2E8F0;

  --primary: #2563EB;
  --primary-foreground: #FFFFFF;

  --secondary: #0F766E;
  --secondary-foreground: #FFFFFF;

  --accent: #F59E0B;
  --accent-foreground: #111827;

  --success: #16A34A;
  --warning: #D97706;
  --danger: #DC2626;
}
```

### Tailwind Usage

Use:

- `bg-slate-50` for page backgrounds
- `bg-white` for cards and panels
- `text-slate-900` for primary text
- `text-slate-600` for secondary text
- `text-slate-500` for helper text
- `border-slate-200` for dividers and cards
- `bg-blue-600 text-white` for primary CTAs
- `bg-teal-700 text-white` for secondary positive actions
- `bg-amber-50 text-amber-800` for warnings or readiness gaps
- `bg-green-50 text-green-800` for completed or healthy states
- `bg-red-50 text-red-800` only for serious blockers

Do not overuse red. Most missing compliance work should feel actionable, not catastrophic.

## Typography

Use the product font pairing consistently across landing page and app.

Recommended:

- Clash Grotesk for headings
- Satoshi for body text and UI copy
- system font stack

Load the local web font files from `shared/fonts` when implementing the web app.

Headings should be clear and direct. Avoid vague marketing headlines.

Good:

- “Prevent compliance debt before it blocks your first pilot.”
- “Know what is missing before customers ask.”
- “Collect evidence once. Reuse it across frameworks.”

Bad:

- “Revolutionizing Compliance with AI”
- “The Future of Enterprise Governance”
- “Unlock Seamless Security Transformation”

## Layout Principles

Prefer:

- generous whitespace
- simple cards
- clear section hierarchy
- readable line lengths
- obvious primary actions
- calm progress indicators
- small explanatory helper text

Avoid:

- dense tables as the first view
- too many tabs
- nested settings
- dashboard overload
- feature-heavy empty states

## App UX Principles

The app should revolve around operational controls, not framework bureaucracy.

Users should primarily see:

- controls
- tasks
- evidence
- vendors
- policies
- readiness progress

Framework mappings such as SOC 2 or GDPR should be visible but secondary.

Good mental model:

```text
Shared Control
→ Evidence
→ Tasks
→ Framework Mappings
```

Bad mental model:

```text
Framework Requirement
→ Duplicated Checklist
→ Separate Evidence
```

Evidence should be uploaded once and reused across mapped frameworks.

## Landing Page UX Principles

The landing page should validate pain, not oversell product maturity.

Optimize for:

- “this is exactly my problem”
- email signup
- founder interviews
- Reddit credibility
- simple explanation

Suggested structure:

1. Hero
2. Pain story
3. What the product helps with
4. Who it is for
5. What it is not
6. Email signup CTA

The page should feel honest and early, not like a mature enterprise product.

## Copy Principles

Be concrete.

Instead of:

> Streamline governance workflows.

Say:

> Track policies, vendors, evidence, and security tasks before enterprise customers ask for them.

Instead of:

> Automated compliance intelligence.

Say:

> Know which basic controls are missing and what evidence to collect.

Instead of:

> Become compliant instantly.

Say:

> Build toward SOC 2 and GDPR readiness without starting from scratch later.

## Status & Progress UX

Use progress to create momentum, not false certainty.

Preferred labels:

- Not started
- In progress
- Needs evidence
- Ready for review
- Complete

Avoid labels that imply legal certainty:

- Compliant
- Certified
- Audit-proof
- Guaranteed

Readiness scores are okay, but should be framed as internal readiness, not official compliance.

Example:

```text
SOC 2 readiness: 62%
```

Add helper text:

```text
This is an internal readiness estimate, not a certification.
```

## Empty States

Empty states should teach and move the user forward.

Example:

```text
No evidence added yet.

Start by uploading a screenshot, policy, or note that shows how this control is handled today.
```

Avoid:

```text
No data found.
```

## Design North Star

The product should make a founder feel:

> “We are not certified yet, but we are organized, credible, and building in the right direction.”

That is the experience to design for.
