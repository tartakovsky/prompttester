# Add fold/unfold toggle and wider result columns

**Date:** 2026-02-20 15:02
**Scope:** `apps/web/src/app/page.tsx`, `apps/web/src/components/result-cell.tsx`

## Summary
Added fold/unfold toggle for result cards and increased column width on large screens. When unfolded, result cards expand to full content height with no truncation.

## Decisions Made

### Fold/unfold toggle
- **Chose:** Link-style button ("Fold"/"Unfold") placed next to model-first/prompt-first buttons
- **Why:** User requested URL-looking button in that area; link style is minimal and consistent

### Unfolded behavior
- **Chose:** Remove max-h-[300px], show full output, hide per-card "show more/less"
- **Why:** When globally unfolded, per-card expand is redundant; users want to see everything

### Column width
- **Chose:** width: 450px, minWidth: 350px (was both 350px)
- **Why:** User feedback that cards are too narrow for reading long text; 350px remains the minimum on smaller screens

## Key Files for Context
- `apps/web/src/app/page.tsx` — fold/unfold state, toggle placement
- `apps/web/src/components/result-cell.tsx` — unfolded prop handling
