# Commit copy buttons + redesign result cards

**Date:** 2026-02-20 15:00
**Task:** Commit current copy button work, then redesign result cards: wider on big screens, fold/unfold toggle

## Goal
1. Commit and push current copy button + narrower sections work
2. Make result card columns wider on large screens (current 350px is minimum, go wider on xl+)
3. Add fold/unfold toggle near model-first/prompt-first buttons
4. Unfold = result cards expand to full content height (no max-h), fold = current max-h-[300px]

## Approach

### Step 1: Commit + push current work
### Step 2: Result card changes
1. Increase result column min-width from 350px to ~450px on large screens
2. Add `unfolded` boolean state
3. Add "Unfold" / "Fold" toggle button near the model-first/prompt-first buttons
4. Pass `unfolded` to ResultCellContent, remove max-h-[300px] when unfolded
5. When unfolded, show full output (no truncation), hide show more/less

## Files to Modify
- `apps/web/src/app/page.tsx` — fold/unfold state, toggle button, wider columns
- `apps/web/src/components/result-cell.tsx` — accept unfolded prop, conditionally remove max-height
