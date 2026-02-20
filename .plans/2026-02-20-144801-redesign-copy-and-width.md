# Redesign: narrower sections, move word count + copy to top-right

**Date:** 2026-02-20 14:48
**Task:** Remove bottom bar, narrow sections to 8/12 cols, show word count + copy in top-right of textarea on white bg

## Goal
- Remove the gray bottom border-t bar that shows word count
- Inputs, Prompts, Models sections should be max 8/12 columns wide (not full width)
- Show word count and copy button together in the top-right corner of the textarea area, on white background
- On mobile they stay full width as they are now

## Approach

### Step-by-step plan
1. In page.tsx, wrap the Inputs/Prompts/Models sections in a container with `max-w-4xl` or `w-8/12`
2. Remove the bottom word count bar from both textareas
3. Add a floating div in top-right of textarea showing "{N} words" + copy button, with white/card bg
4. Keep the CopyButton component returning null when empty — show the whole floating div only when there's content

## Files to Modify
- `apps/web/src/app/page.tsx` — all changes here
