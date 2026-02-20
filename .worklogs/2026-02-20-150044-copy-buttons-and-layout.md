# Add copy buttons and narrow input/prompt/model sections

**Date:** 2026-02-20 15:00
**Scope:** `apps/web/src/components/copy-button.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/components/result-cell.tsx`

## Summary
Added copy-to-clipboard buttons to input textareas, prompt textareas, and result cells. Narrowed Inputs/Prompts/Models sections to max-w-4xl. Moved word count + copy button to a floating pill in the top-right corner of textareas (on white bg).

## Context & Problem
Users needed a quick way to copy content from inputs, prompts, and results without manual text selection. The sections were also unnecessarily wide on large screens.

## Decisions Made

### CopyButton component
- **Chose:** Reusable `CopyButton` in `components/copy-button.tsx` with lucide Copy/Check icons
- **Why:** DRY — used in 3 places (inputs, prompts, result cells)
- **Alternatives:** Inline clipboard logic — rejected, repetitive

### Positioning
- **Chose:** Floating pill in top-right of textareas (word count + copy together), bottom-right of result cells (in token footer)
- **Why:** User feedback — bottom-right initially not visible, then moved to top-right with white bg pill after iteration

### Section width
- **Chose:** `max-w-4xl` on Inputs, Prompts, Models sections
- **Why:** User requested ~8/12 columns; max-w-4xl (~56rem) achieves this within the max-w-7xl container

### Word count bar removal
- **Chose:** Removed the gray border-t bottom bar, replaced with floating overlay
- **Why:** User explicitly requested removing the bottom line/bar

## Information Sources
- User feedback and screenshots during iterative development
- Existing page.tsx structure and result-cell.tsx component

## Key Files for Context
- `apps/web/src/app/page.tsx` — main app, all sections
- `apps/web/src/components/copy-button.tsx` — reusable copy button
- `apps/web/src/components/result-cell.tsx` — result card rendering
