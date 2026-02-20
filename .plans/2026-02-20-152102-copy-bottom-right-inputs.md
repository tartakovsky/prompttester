# Move word count + copy to bottom-right of input/prompt textareas

**Date:** 2026-02-20 15:21
**Task:** Move word count and copy button from top-right floating pill to bottom-right, same style as result cards

## Approach
1. Change position from `absolute top-2 right-2` to bottom-right
2. Use a footer row like result cards: a border-t bar with word count left and copy button right
3. Always show the footer (not conditional on content) — copy hides itself when empty, word count shows 0 or hides

Actually, to match result cards: put them in a bottom bar with border-t, word count on left, copy on right. Show bar always, word count only when content exists, copy only when content exists.

## Files to Modify
- `apps/web/src/app/page.tsx` — restructure input/prompt textarea footer
