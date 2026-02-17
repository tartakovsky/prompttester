# Fix result grid label colors and styles to match section headers

**Date:** 2026-02-17 20:41
**Scope:** `apps/web/src/app/page.tsx`

## Summary
Fixed result grid labels: added teal color to input labels, made all labels use same style as section headers (text-xs font-medium uppercase tracking-widest), added accent colors to results sidebar ItemList.

## Changes
- Input name labels in results: added `accentStyles.teal.title`
- All result labels: changed from `text-sm font-semibold` to `text-xs font-medium uppercase tracking-widest` to match section headers
- Results sidebar: added `accent="blue"` for prompts, `accent="violet"` for models
- Fixed reference to removed `.label` field → use `.title` instead
