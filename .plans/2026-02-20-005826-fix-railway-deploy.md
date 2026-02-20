# Fix Railway deploy failures

**Date:** 2026-02-20 00:58
**Task:** Fix two Railway deploy issues

## Goal
Get the web service deploying on Railway again.

## Approach
1. Fix `start` script: remove hardcoded `-p 3010`, use `next start` so Railway's `$PORT` is picked up
2. Fix workspace dep: Railway builds from `apps/web` root directory, so `@prompttester/types` at `"*"` won't resolve. Inline the types or remove the shared package dependency for now.
