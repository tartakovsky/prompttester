# Migrate landing page draft to typed block architecture

**Date:** 2026-02-18 15:36
**Task:** Create apps/landing with typed block architecture (following steady-parent pattern), migrate draft design content into it, and document the architecture in CLAUDE.md.

## Goal
A fully typed, architected landing page at `apps/landing` following the steady-parent block pattern: types define block shapes, content file provides data conforming to types, block components receive typed props, page.tsx orchestrates composition.

## Input Information
- **Reference architecture:** `/Users/tartakovsky/Projects/steady-parent/apps/landing` — typed blocks with `types.ts`, `content.ts`, per-block components, page orchestrator
- **Draft design:** `/Users/tartakovsky/Downloads/prompttester-landing.zip` — Vite+React prototype with 5 sections (hero, features, trust, CTA, footer)
- **Existing scaffold:** `apps/landing` already exists with Next.js 16, Tailwind v4, minimal placeholder page
- **Design content:** Hero badge, headline, subheading, CTA; 3 feature cards; 3 trust items; final CTA; footer tagline

## Approach

### Step-by-step plan

1. **Create `apps/landing/src/content/landing/types.ts`** — Define interfaces for each block:
   - `HeroContent` (badge, title, subtitle, body, primaryCta, helperText)
   - `FeatureItem` + `FeaturesContent` (title, items array of 3)
   - `TrustItem` + `TrustContent` (items array of 3)
   - `CtaContent` (title, body, cta)
   - `FooterContent` (tagline)
   - `LandingContent` — master interface mapping all blocks

2. **Create `apps/landing/src/content/landing/content.ts`** — Populate with actual copy from draft design, typed as `LandingContent`

3. **Create block components** in `apps/landing/src/components/landing/`:
   - `hero-section.tsx` — Badge pill, headline, subheading, CTA button, helper text
   - `features-section.tsx` — "How it works" heading + 3-card grid
   - `trust-section.tsx` — 3-column trust badges
   - `cta-section.tsx` — Final CTA block
   - `footer.tsx` — Simple footer with tagline

4. **Update `apps/landing/src/app/page.tsx`** — Import content + blocks, compose in order

5. **Add card + button UI components** — Need `Card` and `Button` from shadcn/ui for the landing. Add dependencies (`clsx`, `tailwind-merge`) and create minimal components.

6. **Add `apps/landing/CLAUDE.md`** — Document the typed block architecture pattern

### Key decisions
- **Follow steady-parent pattern exactly:** types.ts → content.ts → block components → page orchestrator
- **Keep it simple:** The draft has 5 blocks (not 15 like steady-parent), so the architecture is lighter but follows the same pattern
- **No emoji in block data:** Use emoji strings in content.ts rather than Lucide icons (matching the draft design)
- **Server components:** All blocks are server components (no interactivity needed on landing page, CTA links to the app)
- **CTA links to app:** Instead of `onLaunch` callback, CTAs link to the web app URL

## Architectural Considerations
- Blocks are independent, receive typed data, no cross-block dependencies
- Content changes only require editing content.ts — type errors catch mismatches at build time
- Page.tsx is pure composition — no logic
- Uses existing Tailwind v4 setup in globals.css

## Risks & Edge Cases
- Need to add `clsx` + `tailwind-merge` for `cn()` utility (or create simple components without it)
- CTA destination URL — will point to `/` on the web app (separate deployment)

## Files to Modify
- `apps/landing/src/content/landing/types.ts` — NEW: block type definitions
- `apps/landing/src/content/landing/content.ts` — NEW: typed content data
- `apps/landing/src/components/landing/hero-section.tsx` — NEW: hero block
- `apps/landing/src/components/landing/features-section.tsx` — NEW: features block
- `apps/landing/src/components/landing/trust-section.tsx` — NEW: trust block
- `apps/landing/src/components/landing/cta-section.tsx` — NEW: CTA block
- `apps/landing/src/components/landing/footer.tsx` — NEW: footer block
- `apps/landing/src/app/page.tsx` — UPDATE: orchestrator
- `apps/landing/src/lib/utils.ts` — NEW: cn() utility
- `apps/landing/CLAUDE.md` — NEW: architecture documentation
- `apps/landing/package.json` — UPDATE: add clsx, tailwind-merge
