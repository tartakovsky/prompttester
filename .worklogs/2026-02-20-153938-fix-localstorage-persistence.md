# Fix localStorage data persistence

**Date:** 2026-02-20 15:39
**Scope:** `apps/web/src/app/page.tsx`, `apps/web/src/lib/cache.ts`

## Summary
Eliminated race condition that caused localStorage data loss by switching from two-phase useEffect loading to synchronous lazy useState initializers. Fixed snapshot save to not depend on activeTestId. Added console warnings on save failures.

## Context & Problem
Users reported API key disappearing, results lost after deploy, data lost on re-login. Root cause: state initialized empty then loaded from localStorage in useEffect, creating a window where auto-save effects could overwrite good data with empty defaults.

## Decisions Made

### Synchronous lazy initializers
- **Chose:** Single `useState(() => { ... })` that reads all localStorage synchronously on first render
- **Why:** Eliminates the race condition entirely — state is correct from the very first render, so save effects always save valid data
- **Alternative:** Keep useEffect + add loaded gate on render — works but more complex and still has edge cases

### Snapshot save ref
- **Chose:** Use `snapshotTestIdRef` instead of `activeTestId` in snapshot save dependency
- **Why:** When switching tests, the effect was firing with new activeTestId but old snapshot, potentially saving stale data under wrong key

### Console warnings
- **Chose:** `console.warn` on save failures instead of silent catch
- **Why:** Users had no idea their data wasn't being saved when quota exceeded or other errors occurred

## Key Files for Context
- `apps/web/src/app/page.tsx` — main app, state initialization and persistence
- `apps/web/src/lib/cache.ts` — localStorage wrapper functions
