# Trigger landing deploy from GitHub

**Date:** 2026-02-18 15:50
**Scope:** No code changes

## Summary
Empty commit to trigger a fresh Railway deploy from the GitHub source. The initial build failed because it used a stale CLI snapshot from `railway add` instead of pulling from GitHub.

## Context & Problem
The `railway add` command created the service with a CLI snapshot (64 kB) that didn't contain the full repo. The service is now properly configured with the GitHub source, but needs a new push to trigger a GitHub-based build.

## Key Files for Context
- `apps/landing/CLAUDE.md` — Landing app architecture docs
