# Colorful section accents + model toggle + results label colors

**Date:** 2026-02-17 20:24
**Task:** Make section colors actually visible/colorful, color-match labels in results grid, add model enable/disable toggle

## 1. Actually Colorful Section Accents
Current stone/slate/zinc are too neutral to see. Switch to real colors:
- **Inputs**: Amber/warm — `amber` palette
- **Prompts**: Blue — `blue` palette
- **Models**: Violet/purple — `violet` palette

Applied to: section titles, active item borders+bg, hover states, add button borders.

## 2. Results Grid Label Colors
- In model-first: prompt labels on left should use blue (prompts color), model column headers should use violet (models color), input labels use amber (inputs color)
- In prompt-first: prompt column headers should use blue, model sidebar items should use violet, input labels use amber

## 3. Model Toggle (Enable/Disable)
Instead of add/remove for default models, use checkboxes/toggles:
- Models section shows ALL default models with enable/disable toggle
- Only enabled models are used in evaluation
- Can still add custom models via the "Add model by ID" input
- Custom models can be removed (x button), default models can only be toggled

Implementation: Add `enabled` field to ModelItem (default true). Filter by `enabled` for eval. Show toggle UI in the model list items.

## Files to Modify
- `apps/web/src/app/page.tsx` — all changes
