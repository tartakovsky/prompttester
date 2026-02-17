# Results grid redesign: visual grid, snapshot state, prompt column

**Date:** 2026-02-17 20:11
**Scope:** `apps/web/src/app/page.tsx`

## Summary
Redesigned results section with CSS grid layout, snapshot-based rendering, prompt column in model-first view, and sidebar moved to left.

## Decisions Made

### CSS grid instead of HTML table
- **Chose:** CSS grid with `grid-template-columns` for flexible layout
- **Why:** Allows input/prompt labels outside the bordered results area per user's mockup

### Result snapshot pattern
- **Chose:** Capture inputs/prompts/models at eval time into `ResultSnapshot`, persist to localStorage per test
- **Why:** Results should show the state of the run, not live edits. Adding prompts or editing inputs after a run should not change the results display.

### Prompt column in model-first
- **Chose:** Second label column showing selected prompt name + text alongside each input
- **Why:** User needs to see what input+prompt combination produced each model result

## Key Files for Context
- `apps/web/src/app/page.tsx` — all changes
- `.plans/2026-02-17-193937-results-grid-redesign.md` — grid layout plan
- `.plans/2026-02-17-195129-results-snapshot-sidebar-left.md` — snapshot + sidebar plan
