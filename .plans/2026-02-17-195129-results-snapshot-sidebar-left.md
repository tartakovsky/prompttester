# Fix results: snapshot state at run time + move sidebar left

**Date:** 2026-02-17 19:51
**Task:** Results should display the state of the run (not live state), and model/prompt list should be on the left

## Issues
1. Results grid reads live `prompts`/`inputs` arrays — editing prompts/inputs or adding new ones changes the results table. Should snapshot at eval time.
2. The model/prompt selector ItemList is positioned top-right. Should be on the left as a sidebar.

## Approach

### 1. Snapshot results state
- Add a `ResultSnapshot` type that captures: prompts (with their text + results), inputs (with their content), models (with names), at evaluation time
- Store snapshot in state: `const [resultSnapshot, setResultSnapshot] = useState<ResultSnapshot | null>(null)`
- At the END of evaluation (in `runEval`), capture the snapshot from current test state
- Results section renders from `resultSnapshot` instead of live state
- `hasAnyResults` checks `resultSnapshot` instead of live prompts

### 2. Move sidebar to the left
- In the results section, use `flex gap-4` with ItemList on the left and the grid on the right (same pattern as the inputs/prompts/models sections above)

## Files to Modify
- `apps/web/src/app/page.tsx`
