# Redesign Prompt Tester UI — three sections, multi-test, persistence

**Date:** 2026-02-17 19:31
**Scope:** `apps/web/src/app/page.tsx`, `apps/web/src/app/globals.css`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/api/evaluate/route.ts`

## Summary
Complete UI redesign of the prompt tester app. Replaced scorer/commenter-specific UI with a generic prompt tester having three uniform sections (Inputs, Prompts, Models), added multi-test support with localStorage persistence, auto light/dark theme, and multiple UX fixes.

## Context & Problem
The app was originally built around a scorer/commenter test type with score thresholds. User wanted a simpler, generic prompt tester: inputs × prompts × models → output. The UI needed to be reorganized into three uniform sections with shared layout, support multiple persistent tests, and automatically adapt to the user's system theme.

## Decisions Made

### Theme: CSS media query instead of class-based
- **Chose:** `@media (prefers-color-scheme: dark)` with `@custom-variant dark`
- **Why:** Auto-adapts to user's system preference without any toggle UI needed
- **Alternatives:** Class-based toggle with localStorage — rejected as user explicitly wanted auto-adapt

### localStorage persistence: skip-first-invocation pattern
- **Chose:** Per-effect `useRef` that skips the first invocation of each auto-save effect
- **Why:** React batches state updates from the mount effect, so auto-save effects fire with default values before loaded data takes effect. The skip-first pattern reliably prevents overwriting cached data.
- **Alternatives:** Single `isLoading` ref — tried first but failed because React effects all run in the same flush and state updates are batched

### Multi-test architecture
- **Chose:** `tests` array in state with `activeTestId`, each test stores inputs/prompts/models/temperature independently. API key is global.
- **Why:** Keeps tests fully independent while sharing the API key which is a global config

### Results clearing on delete
- **Chose:** Removed results-clearing from `removeModel` and `removeInput`
- **Why:** Previous code cleared ALL prompt results when deleting any model or input, causing catastrophic data loss

### ItemList readOnly prop
- **Chose:** Single `readOnly` prop on ItemList that hides +, ×, and disables rename
- **Why:** Results sidebar should show items for navigation but not allow modification

## Key Files for Context
- `apps/web/src/app/page.tsx` — main app component with all UI, state management, persistence
- `apps/web/src/app/api/evaluate/route.ts` — simplified API route for prompt evaluation
- `apps/web/src/app/globals.css` — theme variables and base styles
- `.plans/2026-02-17-183020-ui-redesign.md` — original redesign plan
- `.plans/2026-02-17-190127-fix-localstorage-race.md` — localStorage race condition fix plan

## Next Steps / Continuation Plan
1. Improve results table readability — show prompt/input context in headers so users understand what each result cell represents
2. Deploy updated version to Railway
