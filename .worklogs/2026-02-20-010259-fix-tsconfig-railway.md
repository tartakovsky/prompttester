# Fix tsconfig extends for Railway

**Date:** 2026-02-20 01:02
**Scope:** apps/web/tsconfig.json, apps/landing/tsconfig.json

## Summary
Inlined base tsconfig settings into each app's tsconfig.json since Railway builds from app subdirectories and can't resolve `../../tsconfig.base.json`.

## Context & Problem
Railway's root directory setting means it only sees `apps/web/` as the project root during build. The `extends: "../../tsconfig.base.json"` path fails because `tsconfig.base.json` is in the monorepo root which doesn't exist in Railway's build context.

## Decisions Made
- **Chose:** Inline all base compilerOptions into each app's tsconfig
- **Why:** Simplest fix that works with Railway's subdirectory build model
- **Alternatives:** Change Railway root to monorepo root — too disruptive to existing deploy config

## Key Files for Context
- `apps/web/tsconfig.json` — inlined base settings
- `apps/landing/tsconfig.json` — inlined base settings
- `tsconfig.base.json` — still exists for local dev and packages/types
