# Fix result grid label colors and styles

**Date:** 2026-02-17 20:40
**Task:** Input labels not colored in results. Sidebar in results not colored. Result headers different shade — should match section header style (text-xs font-medium uppercase tracking-widest).

## Changes
1. Input name labels in results grid → add teal title color
2. Model/prompt column headers → match section header style (text-xs uppercase tracking-widest, not text-sm font-semibold)
3. Prompt/model name labels in data rows → same style as section headers
4. Results sidebar ItemList → pass accent prop (blue for prompts, violet for models)

## Files
- `apps/web/src/app/page.tsx`
