# Colorful section accents, results label colors, model toggle

**Date:** 2026-02-17 20:27
**Scope:** `apps/web/src/app/page.tsx`

## Summary
Replaced invisible neutral accents (stone/slate/zinc) with actually colorful ones (amber/blue/violet). Added color-matching labels in results grid. Added enable/disable toggle for models instead of just add/remove.

## Decisions Made

### Visible color palette
- **Chose:** amber (Inputs), blue (Prompts), violet (Models)
- **Why:** Previous stone/slate/zinc were indistinguishable. These are distinct, recognizable colors that don't clash.

### Model toggle instead of add/remove
- **Chose:** Checkbox toggle on each model item, `enabled` field on ModelItem
- **Why:** Default models should always be available to turn on/off. Finding model IDs on OpenRouter is tedious, so keeping them in the list but toggleable is better UX.
- **Migration:** Existing models from localStorage without `enabled` field get `enabled: true` on load.

### Results grid label colors
- **Chose:** Input labels use amber, prompt labels use blue, model headers use violet — matching their section colors
- **Why:** Visual consistency between sections and results grid helps users understand which section each label belongs to.

## Key Files for Context
- `apps/web/src/app/page.tsx` — all changes
- `.plans/2026-02-17-202406-colorful-accents-model-toggle.md` — plan
- `.worklogs/2026-02-17-201742-models-section-colors.md` — prior worklog (first attempt at neutral colors)
