# Fix tsconfig extends for Railway

**Date:** 2026-02-20 01:02
**Task:** Fix tsconfig.json extends path that fails on Railway

## Goal
Make the web and landing apps build on Railway where root dir is `apps/web` or `apps/landing`.

## Approach
Inline the base tsconfig settings into each app's tsconfig.json. The `extends` to `../../tsconfig.base.json` can't resolve when Railway only copies the app subdirectory.
