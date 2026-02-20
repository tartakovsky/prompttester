# Fix localStorage data persistence issues

**Date:** 2026-02-20 15:36
**Task:** Fix data loss: API key disappearing, results lost after deploy, data lost on re-login

## Goal
Ensure localStorage data survives page reloads, deploys, and auth state changes reliably.

## Root Causes
1. **Race condition:** State initializes empty, then loads from localStorage in useEffect. Auto-save effects could fire during that window if React batching doesn't protect us.
2. **cacheLoaded guard is fragile:** It's a ref set synchronously at end of load effect, but React's effect ordering isn't guaranteed to prevent intermediate renders from triggering save effects with empty state.
3. **Snapshot save on activeTestId change:** When switching tests, `[resultSnapshot, activeTestId]` dependency can save stale snapshot under new test ID.
4. **No protection against saving null/empty over valid data:** If load fails silently, saves proceed with defaults.

## Approach

### Step-by-step plan
1. **Don't render until loaded:** Add a `loaded` state boolean. Show nothing (or a spinner) until localStorage is read. This eliminates the race condition entirely — no empty state is ever rendered, so no save effects fire with bad data.
2. **Initialize state from localStorage directly:** Use lazy initializers in `useState(() => ...)` to read from localStorage synchronously on first render, avoiding the two-phase load entirely.
3. **Fix snapshot save:** Only save snapshot when it's non-null AND the activeTestId matches the snapshot's test context.
4. **Protect against saving empty over valid:** In cacheSave for tests, don't save an empty array if localStorage already has data.

### Key decisions
- **Chose:** Lazy useState initializers over the two-phase useEffect approach
  - Why: Eliminates the race condition at the source. State is correct from the very first render.
  - Alternative: Keep useEffect + add loaded gate on render — works but more complex
- **Keep the cacheLoaded ref:** Still useful for the apiKey which starts as '' (valid empty state vs loaded state)

## Files to Modify
- `apps/web/src/app/page.tsx` — refactor state initialization to use lazy initializers, add loaded gate
- `apps/web/src/lib/cache.ts` — add warning on save failure
