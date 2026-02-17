# Fix build: add missing `enabled` field to ModelItem constructors

**Date:** 2026-02-17 21:24
**Task:** Production build fails — `enabled` is required on ModelItem but missing in addModel and addEmptyModel

## Fix
Add `enabled: true` to the two ModelItem constructors that are missing it (lines 699, 707).

## Files
- `apps/web/src/app/page.tsx` — lines 699, 707
