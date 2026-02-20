# Always show copy button in bottom-right of textareas

**Date:** 2026-02-20 14:44
**Task:** Make copy button always visible at bottom-right of input/prompt textareas, not hidden inside word count bar

## Goal
Copy button should always be visible at the bottom-right corner of the textarea area, regardless of whether there's content. Move it out of the conditional word count bar and position it absolutely at bottom-right.

## Approach
1. Add `relative` back to the textarea container div
2. Position CopyButton as `absolute bottom-2 right-2` outside the word count conditional
3. Restore word count bar to its original non-flex layout
4. Remove CopyButton from inside the word count bar

## Files to Modify
- `apps/web/src/app/page.tsx` — reposition copy buttons for both input and prompt textareas
