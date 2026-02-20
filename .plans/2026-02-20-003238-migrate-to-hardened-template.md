# Migrate Prompt Tester to Hardened Template Architecture

**Date:** 2026-02-20 00:32
**Task:** Move all current files to legacy/, copy template from ts-java-railway, edit template files to re-implement prompttester functionality.

## Goal
Replace the current ad-hoc monorepo structure with the hardened template architecture while preserving all existing functionality.

## Approach
1. Move everything to `legacy/`
2. Copy template (minus .git, node_modules, Java)
3. Edit root files for prompttester
4. Edit packages/types with domain schemas
5. Edit apps/web — split page.tsx into components
6. Edit apps/landing — port landing content
7. Install, build, verify
