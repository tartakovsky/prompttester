# Responsive sidebar + multi-test support

**Date:** 2026-02-17 18:41
**Task:** Narrow sidebars on mobile, add test-level persistence (create/switch/delete tests)

## Goal
1. Sidebar cards shrink ~15% on narrow viewports
2. Users can create multiple named tests, each with independent inputs/prompts/models/temperature/results. Tests persist in localStorage. Users can switch between tests and delete them.

## Approach

### 1. Responsive sidebar
- Change ItemList width from fixed `w-[200px]` to responsive: `w-[170px] md:w-[200px]`

### 2. Multi-test support
- Add a `Test` type: `{ id, name, inputs, prompts, models, temperature, apiKey }`
- Store all tests in localStorage under `prompttester:tests`
- Store active test ID under `prompttester:activeTestId`
- Add a test selector at the top of the page (dropdown or horizontal tabs)
- "New Test" button creates a fresh test with defaults
- Delete button on each test (with confirmation if it has content)
- When switching tests, save current test state and load the new one
- API key shared across all tests (stored separately, not per-test)

### Architecture
- Each test stores its own: inputs, prompts, models, temperature
- API key is global (not per-test)
- Test selector sits between the header and the content sections
- All current state management stays the same, but wrapped in a test context

## Files to Modify
- `apps/web/src/app/page.tsx` — add test management, responsive sidebar
