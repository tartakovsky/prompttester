# Fix results table column sizing

**Date:** 2026-02-18 15:26
**Task:** table-fixed made everything too narrow. Need scrollable table with: input col ~250px max (shrinks), result cols ~350px fixed.

## Approach
1. Remove `table-fixed` — go back to auto layout but with proper min/max constraints
2. Use `colgroup` with explicit col widths: input col max-width 250px, result cols 350px each
3. Actually simpler: just remove table-fixed, set minWidth on result th/td to 350px, and constrain input td with max-width 250px + truncate. The table's overflow-x-auto wrapper already handles horizontal scroll.

## Files to Modify
- `apps/web/src/app/page.tsx`
