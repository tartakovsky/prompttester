# Add prompt column in model-first results view

**Date:** 2026-02-17 20:05
**Task:** In model-first view, add a Prompt column next to Input so users see what input+prompt combination produced each result

## Approach
- In model-first mode, add a second label column (Prompt) before the result columns
- Grid template becomes: `240px 240px repeat(N, minmax(280px, 1fr))`
- Row 0 header: empty corner, "Prompt" label area (or empty), then model names
- Each data row: Input label, Prompt label (same for all rows since it's selected prompt), then result cells
- The prompt column shows the snapshot prompt name + text, same style as input column

## Files to Modify
- `apps/web/src/app/page.tsx` — model-first grid rendering in results section
