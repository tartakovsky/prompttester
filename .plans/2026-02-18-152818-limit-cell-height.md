# Limit result cell height with scrollable overflow

**Date:** 2026-02-18 15:28
**Task:** Result cells can become giant walls of text. Limit to ~400px max height, make content scrollable.

## Approach
Add `max-h-[400px] overflow-y-auto` to the ResultCellContent card div when expanded.

## Files to Modify
- `apps/web/src/app/page.tsx` — ResultCellContent component
