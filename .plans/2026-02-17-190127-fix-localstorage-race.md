# Fix localStorage race condition — data lost on hard refresh

**Date:** 2026-02-17 19:01
**Task:** Fix auto-save overwriting cached data with defaults on page load

## Goal
Data persists across hard refreshes. No race condition between loading and saving.

## Input Information
- Bug: mount effect sets `isLoading.current = false` synchronously, then auto-save effects fire in the same React effect flush. But `setTests(savedTests)` is batched — `tests` is still the default value when auto-save runs. Result: defaults overwrite saved data.
- The `isLoading` ref approach is fundamentally broken because React effects all run in the same flush after a render, and state updates from the mount effect haven't taken effect yet.

## Approach

### Fix: skip-first-invocation pattern
Each auto-save effect independently skips its first invocation using its own ref. This is reliable because:
1. First render: effects all run for the first time → all skip (first invocation)
2. Mount effect loads data → `setTests(loaded)` → triggers re-render
3. Second render: effects run with loaded data → save correctly

```javascript
const testsFirstRun = useRef(true);
useEffect(() => {
  if (testsFirstRun.current) { testsFirstRun.current = false; return; }
  cacheSave('tests', tests);
}, [tests]);
```

Remove `isLoading` ref entirely. Each auto-save gets its own `*FirstRun` ref.

## Files to Modify
- `apps/web/src/app/page.tsx` — replace isLoading pattern with per-effect skip-first refs
