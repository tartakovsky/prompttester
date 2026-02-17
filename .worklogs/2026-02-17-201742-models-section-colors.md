# Replace default models + add section color differentiation

**Date:** 2026-02-17 20:17
**Scope:** `apps/web/src/app/page.tsx`

## Summary
Replaced default models with autosmm commenter's SUPPORTED_MODELS list and added color-coded visual differentiation between Inputs, Prompts, and Models sections.

## Decisions Made

### Model list from autosmm commenter
- **Chose:** Use the exact 6 models from autosmm's `packages/commenter/src/index.ts` SUPPORTED_MODELS
- **Why:** User confirmed these are good, well-tested models for LLM evaluation

### Neutral color palette for sections
- **Chose:** stone (Inputs), slate (Prompts), zinc (Models) — Tailwind's neutral palettes
- **Why:** User wanted differentiation without evoking specific emotions. These are all gray-family colors with slightly different undertones (warm brown-gray, cool blue-gray, pure gray)
- **Alternatives considered:**
  - Saturated colors (blue, green, orange) — rejected, too emotionally charged per user request
  - Single color with opacity variations — rejected, not distinct enough

### Accent application points
- **Chose:** Section title color, active item border + background tint, hover states on items and add button
- **Why:** Provides enough visual distinction without being overwhelming. The `SectionAccent` type and `accentStyles` record make it easy to add/change accents

## Key Files for Context
- `apps/web/src/app/page.tsx` — all changes
- `.plans/2026-02-17-201339-models-and-section-colors.md` — plan for this work
- `.worklogs/2026-02-17-201157-results-grid-snapshot.md` — prior worklog (results grid + snapshot)
