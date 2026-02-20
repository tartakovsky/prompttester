# Adjust result column width and spacing, allow empty prompts/inputs

**Date:** 2026-02-20 15:16
**Scope:** `apps/web/src/app/page.tsx`, `apps/web/src/services/openrouter.ts`, `apps/web/src/types/prompt-tester.ts`

## Summary
Tuned result column width to 420px min-width (from original 350px), halved cell spacing. Also includes fixes to allow empty system prompts and empty input content in evaluations.

## Decisions Made

### Column width
- **Chose:** minWidth 420px (~20% wider than original 350px)
- **Why:** 540px was too wide per user feedback, 420px is the sweet spot

### Cell spacing
- **Chose:** p-1.5 on result td (was p-3)
- **Why:** User said too much spacing between cards, cut in half

### Empty prompts/inputs
- **Chose:** Allow empty system prompt (omit from messages array) and empty input content
- **Why:** Users may want to test without a system prompt or with empty inputs

## Key Files for Context
- `apps/web/src/app/page.tsx` — result table layout
- `apps/web/src/services/openrouter.ts` — OpenRouter API call
- `apps/web/src/types/prompt-tester.ts` — request validation schema
