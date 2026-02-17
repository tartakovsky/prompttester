# Fix model display, naming, and data loss on delete

**Date:** 2026-02-17 18:53
**Task:** Three fixes: read-only model ID, consistent naming, stop clearing data on delete

## Issues
1. Model ID field is editable and confusing — should be read-only display
2. Default model names use friendly names like "Gemini 2.0 Flash" but custom models get the ID suffix — should all use the same convention (just the part after `/`)
3. Deleting a model clears ALL prompt results (`prompts.map(p => ({ ...p, results: {} }))`). Deleting an input does the same. This is overly aggressive and likely caused the user's data loss. Remove all result-clearing on delete.

## Approach
1. Replace editable Model ID input with read-only text display: "Selected: google/gemini-2.0-flash"
2. Change DEFAULT_MODELS names to use short ID format: "gemini-2.0-flash", "deepseek-chat-v3", etc.
3. Remove `prompts: t.prompts.map(p => ({ ...p, results: {} }))` from removeModel and removeInput
