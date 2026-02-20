# Improve results table readability — show prompt/input context

**Date:** 2026-02-17 19:31
**Task:** Make results table more readable by showing prompt text alongside input, so users see what the result is the intersection of.

## Current State
- **Model-first mode**: Sidebar selects prompt. Table has Input column + one column per model. User can see which input and model produced each result, but NOT which prompt (it's hidden in the sidebar selection).
- **Prompt-first mode**: Sidebar selects model. Table has Input column + one column per prompt. User can see which input and prompt, but NOT which model (hidden in sidebar).

## User's Request
- **Model-first**: Add a Prompt column next to Input so user sees both prompt and input context for each result row.
- **Prompt-first**: Add prompt names as a header row above the model columns, visually separated from actual results. The user should see the result as the intersection of input (row) and prompt (column header), with the selected model from the sidebar.

Wait — re-reading the request: "in the model first mode, as a first column you have input and that is good. Like on the second column you should have prompt in the same way as input so we can see like what we are actually evaluating against."

So in model-first mode: add a second column showing the prompt text (the currently selected prompt from sidebar).

"in prompt first — as a first column you have input, which is good. But I guess as the first row you then need to have prompt and they need to be visually separate from actual results."

In prompt-first mode: the columns are prompts. Add a header row that shows the actual prompt text for each prompt column, visually distinct from the result rows.

## Approach

### Model-first mode
- Add a "Prompt" column as the second column (after Input, before model columns)
- Show the active prompt's text in this column (same for every row since it's the selected prompt)
- Truncate/preview the prompt text similar to how input is shown

### Prompt-first mode
- Add a row between the header (column names) and the data rows that shows the actual prompt text for each prompt column
- Style it differently — lighter background, italic, smaller text — to visually separate from results
- First cell of this row says "Prompt" as a label

## Files to Modify
- `apps/web/src/app/page.tsx` — modify the results table rendering for both view modes
