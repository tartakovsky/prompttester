# Create landing app with typed block architecture

**Date:** 2026-02-18 15:45
**Scope:** `apps/landing/` (new files), `apps/landing/package.json` (updated)

## Summary
Created the landing page app at `apps/landing` using a typed block architecture pattern from the steady-parent reference. Migrated design content from the draft prototype into properly typed, separated layers: types → content → block components → page orchestrator.

## Context & Problem
User had a draft landing page design (Vite+React prototype from Magic Patterns) with hardcoded content. Needed to migrate it into the monorepo with a proper architecture following the steady-parent pattern where blocks are typed, content is separated, and components receive typed props.

## Decisions Made

### Typed block architecture
- **Chose:** types.ts → content.ts → block components → page.tsx orchestrator
- **Why:** Matches the steady-parent reference architecture. Build fails if content shape doesn't match types.
- **Alternatives considered:**
  - Single-file component with hardcoded strings — rejected because it's the draft's approach and doesn't scale

### Server components (no "use client")
- **Chose:** All blocks are server components
- **Why:** Landing page has no interactivity — CTAs are plain `<a>` links to the app
- **Alternatives considered:**
  - Client components with onClick handlers — rejected, unnecessary for static marketing page

### CTA links to app.prompttester.io
- **Chose:** `APP_URL = "https://app.prompttester.io"` in content.ts
- **Why:** Landing takes over root domain, web app moves to app subdomain

## Architectural Notes
- 5 block types: Hero, Features, Trust, FinalCta, Footer
- Tuple types enforce exactly 3 feature items and 3 trust items
- Content is all in TypeScript — no CMS, no runtime fetching
- Each component receives exactly one typed prop — no cross-block dependencies

## Information Sources
- Reference architecture: `/Users/tartakovsky/Projects/steady-parent/apps/landing`
- Draft design: `/Users/tartakovsky/Downloads/prompttester-landing.zip`
- Existing scaffold: `apps/landing` already had Next.js 16, Tailwind v4 configured

## Key Files for Context
- `apps/landing/CLAUDE.md` — Architecture documentation
- `apps/landing/src/content/landing/types.ts` — Block type definitions
- `apps/landing/src/content/landing/content.ts` — All landing page copy
- `apps/landing/src/app/page.tsx` — Block orchestrator

## Next Steps / Continuation Plan
1. Deploy via git push and verify Railway build
2. Set up custom domains (prompttester.io → landing, app.prompttester.io → web)
3. Iterate on visual design with /frontend-design
