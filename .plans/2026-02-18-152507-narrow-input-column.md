# Fix input column width in results table

**Date:** 2026-02-18 15:25
**Task:** The Input column in the results table is still too wide despite setting width/maxWidth on the th.

## Goal
Input column should be ~100px, not stretch to fill available space.

## Approach
1. Add `table-fixed` to the table so column widths are respected from the first row
2. Set explicit width on the th (already done) — table-fixed will enforce it
3. Add `overflow-hidden text-ellipsis` to the td content so long input text truncates instead of expanding the column

## Files to Modify
- `apps/web/src/app/page.tsx` — results table
