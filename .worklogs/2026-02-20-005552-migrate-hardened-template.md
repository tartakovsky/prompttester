# Migrate to Hardened Template Architecture

**Date:** 2026-02-20 00:55
**Scope:** Entire project — root config, packages/types, apps/web, apps/landing

## Summary
Migrated the entire prompttester project from an ad-hoc monorepo to the hardened template architecture from `ts-java-railway`. Moved all existing files to `legacy/`, copied template structure, and edited all files to re-implement prompttester functionality with proper zone boundaries, ESLint enforcement, Zod validation, and content pipeline.

## Context & Problem
The existing codebase was a simple turbo monorepo with a single 1235-line `page.tsx` containing all types, components, and logic. No import boundary enforcement, no route wrappers, no shared types package. The hardened template provides machine-enforced architecture guardrails.

## Decisions Made

### Architecture migration approach
- **Chose:** Move everything to `legacy/`, copy template, edit in place
- **Why:** Clean slate with template structure, legacy available as reference
- **Alternatives considered:**
  - Incremental migration — rejected because too many structural changes needed simultaneously

### No database
- **Chose:** Removed all Drizzle/DB references from template
- **Why:** Prompttester uses localStorage only, no server-side persistence
- **Alternatives considered:** None — this is a fundamental design choice

### withPublicBody for evaluate route
- **Chose:** `withPublicBody` instead of `withBody` for the evaluate API
- **Why:** Auth is handled client-side via Clerk; the API key comes from the user's browser. The route needs Zod validation but not server-side auth enforcement since the API key is the real auth mechanism.

### Zod content pipeline for landing
- **Chose:** Full Zod schema → types → content → parse gate pipeline
- **Why:** Template pattern, validates content at build time, catches errors before deploy
- **Alternatives considered:** Keep legacy type-only approach — rejected because Zod gate is strictly better

## Architectural Notes
- Zone boundaries enforced by ESLint: components can't import from services/db, types are leaf nodes
- Route wrappers enforced by ESLint: no raw handler exports
- process.env banned except in `lib/env.ts`
- Pre-commit hook runs tsc + eslint on every commit
- packages/types shared between web and landing (currently only web uses domain schemas)

## Information Sources
- Template: `/Users/tartakovsky/Projects/ts-java-railway/`
- Legacy code: `legacy/apps/web/src/app/page.tsx` (1235 lines)
- Legacy API: `legacy/apps/web/src/app/api/evaluate/route.ts`
- Legacy landing: `legacy/apps/landing/`

## Key Files for Context
- `CLAUDE.md` — project-level agent instructions
- `eslint.config.mjs` — all architecture rules
- `packages/types/src/index.ts` — shared Zod schemas
- `apps/web/src/lib/api.ts` — route wrappers with Clerk auth
- `apps/web/src/app/page.tsx` — main prompt tester UI
- `apps/web/src/types/prompt-tester.ts` — domain types
- `apps/landing/src/content/landing/schemas.ts` — Zod content schemas

## Next Steps / Continuation Plan
1. Push to main to trigger Railway deploy
2. Verify both apps work in production
3. Consider removing `legacy/` directory once verified
