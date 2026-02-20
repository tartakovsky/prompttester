# Force result columns wider

**Date:** 2026-02-20 15:13
**Task:** Result columns not actually getting wider — use minWidth instead of width

## Goal
Force result table columns to be 540px wide. Table `width` is a suggestion; `minWidth` is enforced.

## Approach
Change `style={{ width: '540px', minWidth: '350px' }}` to `style={{ minWidth: '540px' }}` on the th elements.

## Files to Modify
- `apps/web/src/app/page.tsx` — fix column width style
