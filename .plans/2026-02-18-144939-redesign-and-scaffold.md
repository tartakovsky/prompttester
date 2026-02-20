# Redesign main app + landing scaffold + port changes

**Date:** 2026-02-18 14:49
**Task:** Apply visual redesign from zip file to the dashboard app, change port to 3050, create minimal landing page scaffold on port 3051

## Goal
1. Main app (`apps/web`) runs on port 3050 (DONE)
2. Minimal landing page scaffold (`apps/landing`) on port 3051
3. Main app's visual design matches the new design from the zip while keeping all existing business logic

## Input Information
- Design zip has Card-based layout for Inputs/Prompts/Models sections with:
  - Card with CardHeader (bg-muted, uppercase title), sidebar list in bg-secondary, textarea editor, word count footer
  - Fixed heights: 280px inputs/prompts, 300px models
  - Switch toggles for models instead of checkboxes
  - Inline SettingsBar with emoji labels, password toggle overlay, custom Slider
  - HTML table for ResultsGrid with sticky input column
  - ResultCell cards with expand/collapse, token counts, cost display
  - ActionBar with run count formula display
- Current app has: multi-test support, Clerk auth, OpenRouter API, localStorage caching, result snapshots, model pricing, teal/blue/violet accent colors

## Approach

### Step-by-step plan

1. **Landing page scaffold** — Create minimal `apps/landing` with a placeholder page.tsx, layout.tsx, globals.css, config files. No design work.

2. **Redesign page.tsx** — Restyle the existing page.tsx to match the design's visual layout:
   - **SettingsBar area**: Replace current flat API key + temperature with inline row layout (emoji labels, password toggle button overlay on input, Slider component for temperature)
   - **Inputs Section**: Wrap in Card with CardHeader (bg-muted, uppercase tracking-wider title), sidebar in bg-secondary with 280px height, textarea with border-0 and word count footer
   - **Prompts Section**: Same Card treatment as Inputs
   - **Models Section**: Replace ItemList checkbox with Card layout containing Switch toggles per model, add-model input in footer bar, 300px height
   - **ActionBar**: Styled button with run count formula text
   - **ResultsGrid**: Replace CSS grid with HTML table (sticky left column, bordered cells, column headers)
   - **ResultCell**: Card-style cells with expand/collapse, token+cost footer
   - **View mode toggle**: Rounded button group in border container

### Key decisions
- **Keep single-file architecture**: Restyle within page.tsx, don't split into separate component files
- **Keep oklch colors**: Don't switch to the design's HSL system
- **Keep existing ItemList for inputs/prompts**: Adapt its styling to match Card sidebar look rather than replacing it entirely
- **Add Card wrapper around sections**: Use simple div-based Card styling inline rather than importing new Card components

## Files to Modify
- `apps/landing/src/app/page.tsx` — minimal placeholder (create)
- `apps/landing/src/app/layout.tsx` — already created
- `apps/landing/src/app/globals.css` — already created
- `apps/web/src/app/page.tsx` — main redesign work
