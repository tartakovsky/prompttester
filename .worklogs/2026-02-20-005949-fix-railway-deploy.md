# Fix Railway deploy failures

**Date:** 2026-02-20 00:59
**Scope:** apps/web/package.json, apps/landing/package.json, apps/web/src/app/api/evaluate/route.ts, apps/web/src/types/

## Summary
Fixed two Railway deploy issues: hardcoded port in start scripts, and unresolvable workspace dependency `@prompttester/types`.

## Context & Problem
Railway deploy failed because:
1. `start` script used `-p 3010` which overrides Railway's `$PORT` injection
2. `@prompttester/types` at `"*"` can't resolve when Railway builds from `apps/web` root directory (not monorepo root)

## Decisions Made

### Remove @prompttester/types dependency from apps
- **Chose:** Inline the `EvaluateRequestSchema` in `apps/web/src/types/prompt-tester.ts`, remove workspace dep
- **Why:** Railway builds from `apps/web` root directory, can't resolve workspace packages
- **Alternatives considered:** Change Railway root to monorepo root — rejected because it would change the entire deployment setup and Railway config

### Fix start scripts
- **Chose:** Use `next start` (no port) for web, `next start -p ${PORT:-3011}` for landing
- **Why:** Next.js reads `$PORT` env var automatically; landing needs the shell expansion pattern from legacy

## Key Files for Context
- `apps/web/package.json` — start script, removed @prompttester/types dep
- `apps/landing/package.json` — start script with PORT fallback
- `apps/web/src/types/prompt-tester.ts` — now contains EvaluateRequestSchema inline
