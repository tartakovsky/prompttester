# Redesign app with new design + add landing page + port changes

**Date:** 2026-02-18 14:46
**Task:** Apply visual redesign from zip file to existing app, change port to 3050, create landing page on port 3051

## Goal
1. Main app runs on port 3050
2. New landing page app runs on port 3051
3. Main app's visual design matches the new design from the zip file while keeping all existing business logic

## Input Information
- Design zip contains a Vite/React prototype with Card-based layout for Inputs/Prompts/Models sections
- Design uses: Card components with headers, sidebar lists, textarea editors, Switch toggles, Slider for temperature, inline SettingsBar
- Current app has all business logic: multi-test support, Clerk auth, OpenRouter API, localStorage caching, result snapshots, model pricing
- Design is a visual prototype with fake data — we keep our logic, adopt their visual layout

## Approach

### Step-by-step plan

1. **Port change** — Update `apps/web/package.json` dev script to `next dev --turbopack -p 3050`

2. **Create landing page app** — New `apps/landing` Next.js app running on port 3051
   - Minimal Next.js setup
   - Simple landing/marketing page for Prompt Tester

3. **Redesign page.tsx** — Apply the new visual design to the main app:
   - **SettingsBar**: Replace current flat API key + temperature layout with the design's inline row (emoji labels, password toggle button overlay, custom Slider component)
   - **Inputs Section**: Replace flat textarea+sidebar with Card-based layout (CardHeader with title, sidebar in bg-secondary, textarea with word count footer, fixed height 280px)
   - **Prompts Section**: Same Card-based layout as Inputs
   - **Models Section**: Replace current ItemList+checkbox with Card layout using Switch toggles, model list with hover states, add-model input in footer
   - **Action Bar**: Style run button with the design's layout
   - **Results Grid**: Replace CSS grid with HTML table layout (sticky input column, model/prompt column headers, ResultCell cards with expand/collapse)
   - **View Mode Toggle**: Styled toggle buttons in border container
   - Keep ALL existing logic: tests, caching, evaluation, snapshots, pricing

### Key decisions
- **Keep single-file architecture**: The app is intentionally in one file (page.tsx). The design splits into components but we'll keep our structure and just restyle inline
  - Alternative: Split into component files — rejected because the user hasn't asked for architectural changes
- **Adapt design's HSL colors to our oklch system**: The design uses HSL CSS variables; our app uses oklch. We keep oklch since it's already working with our Tailwind v4 setup
  - Alternative: Switch to HSL — rejected, would break existing color system
- **Card-based sections**: Adopt the design's Card layout for inputs/prompts/models instead of current flat layout
- **Switch vs checkbox for models**: The design uses Switch toggles. We'll add a Switch component and use it in the models section, replacing the current checkbox-style toggle

## Architectural Considerations
- The design introduces Card, Switch, Slider components. We already have Button and Input from shadcn. We'll add the missing ones.
- Keep Clerk auth in layout.tsx unchanged
- Keep API route unchanged
- The design's ResultsGrid uses an HTML table — we may adopt this approach or keep our CSS grid depending on which renders better with our data model (we have prompt text previews in cells, the design doesn't)

## Risks & Edge Cases
- The design doesn't account for multi-test support — we need to keep TestSelector and ensure it integrates visually
- The design has fixed heights (280px, 300px) which may not work well on mobile — keep responsive

## Files to Modify
- `apps/web/package.json` — port change to 3050
- `apps/web/src/app/page.tsx` — main redesign
- `apps/web/src/app/globals.css` — may need minor additions for design tokens
- `apps/web/src/components/ui/` — add Switch and Slider components if needed
- `apps/landing/` — new landing page app (create)
- `package.json` (root) — update workspaces if needed
