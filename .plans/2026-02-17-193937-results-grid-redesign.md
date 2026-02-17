# Redesign results as a visual grid with clear separation

**Date:** 2026-02-17 19:39
**Task:** Make results much more readable with spacious grid layout per user's mockup

## User's Mockup Analysis
- Prompt headers sit ABOVE the results grid (outside the bordered area), with name + scrollable text
- Input labels sit to the LEFT of the results grid (outside the bordered area), with name + scrollable text
- Results live inside a clearly bordered grid with thick borders
- Lots of whitespace and spacing
- Input/prompt text areas are scrollable, read-only
- The layout is a CSS grid, NOT a traditional HTML table

## Approach

### Prompt-first mode (columns = prompts, sidebar = model selector)
Layout using CSS grid:
- Row 0: empty corner cell + prompt headers (name + scrollable text, no border)
- Row 1+: input label (name + scrollable text, no border) + result cells (bordered grid)

### Model-first mode (columns = models, sidebar = prompt selector)
- Row 0: empty corner cell + model name headers (no border)
- Row 0.5: show selected prompt text spanning full width
- Row 1+: input label (name + scrollable text) + result cells (bordered grid)

Actually, for model-first, the user's mockup shows prompt text in the input column area. Let me reconsider — in model-first, the sidebar selects the prompt. The prompt text should be visible somewhere. I'll show it as a banner/card above the grid since it's the same for all cells.

### Implementation
Replace the entire results table with a CSS grid-based layout:
- Use `display: grid` with `grid-template-columns`
- Prompt/input text in scrollable `max-h-[100px] overflow-y-auto` containers
- Results grid cells with `border-2 border-border` for strong visual separation
- Generous padding (p-4) in all cells

## Files to Modify
- `apps/web/src/app/page.tsx` — replace results table with CSS grid layout
