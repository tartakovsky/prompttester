# Fix copy button position: move to bottom-right

**Date:** 2026-02-20 14:37
**Task:** Move copy buttons from top-right to bottom-right on input/prompt textareas

## Goal
Copy buttons should appear in the bottom-right corner of input and prompt textareas, not top-right. Place them inside the word count bar (which always shows when there's content).

## Approach

### Step-by-step plan
1. Move CopyButton from absolute top-right into the word count bar, using flex justify-between
2. Remove the `relative` class and `pr-8` padding that were added for absolute positioning
3. Apply same change to both input and prompt textareas

## Files to Modify
- `apps/web/src/app/page.tsx` — reposition copy buttons in both textarea sections
