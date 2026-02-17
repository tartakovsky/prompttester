# Fix build: missing enabled field on ModelItem

**Date:** 2026-02-17 21:25
**Scope:** `apps/web/src/app/page.tsx`

## Summary
Production build failed because `enabled` was added as required to ModelItem but two constructors (addModel, addEmptyModel) were missing it.

## Root Cause
When adding the `enabled: boolean` field to ModelItem, I updated DEFAULT_MODELS but missed the dynamic constructors in `addModel` and `addEmptyModel`.
