# Standalone Prompt Tester — Initial Setup

**Date:** 2026-02-17 16:27
**Scope:** Entire project (new)

## Summary
Created standalone prompt tester project at ~/Projects/prompttester. Turborepo monorepo with apps/web — Next.js 16, Tailwind v4, ShadCN dark theme. Calls OpenRouter directly from a Next.js API route instead of going through the Java backend.

## Context & Problem
The AutoSMM prompt tester is tightly coupled to the AutoSMM ecosystem (BrightData for tweet fetching, Java backend for evaluation, Clerk auth, brand context). Needed an independent, deployable tool that anyone can use with just an OpenRouter API key.

## Decisions Made

### Direct OpenRouter calls from API route
- **Chose:** Next.js API route at `/api/evaluate` that calls OpenRouter directly
- **Why:** Eliminates Java backend dependency entirely. The evaluation logic is simple: system message = prompt, user message = post text, parse JSON response, compute threshold-based actions.
- **Alternatives considered:**
  - Client-side OpenRouter calls — rejected because CORS and API key exposure
  - Keep Java backend as dependency — rejected because defeats the purpose of standalone

### Manual post entry instead of URL fetching
- **Chose:** Users paste text content directly into textarea inputs
- **Why:** BrightData integration is AutoSMM-specific. A standalone tool should work without any external scraping service.

### API key from client header
- **Chose:** Client sends OpenRouter API key via `x-api-key` header, API route uses it
- **Why:** No server-side env needed — tool works immediately with user's own key. Env var supported as fallback.

### Default model list hardcoded
- **Chose:** 5 default models (gemini-2.0-flash, deepseek-chat-v3, llama-3.3-70b, claude-3.5-haiku, qwen-2.5-72b) as toggle buttons, plus custom model input
- **Why:** AutoSMM fetches available models from its own API (which reads from fallback config). Standalone tool doesn't have that, so we show a curated set and let users add any model.

## Key Files for Context
- `apps/web/src/app/page.tsx` — Main page (~900 lines), adapted from AutoSMM tests/page.tsx
- `apps/web/src/app/api/evaluate/route.ts` — OpenRouter proxy (~180 lines), reimplements Java PromptTestService.evaluate()
- `apps/web/src/app/globals.css` — ShadCN theme copied from AutoSMM

## Next Steps
1. Create GitHub repo and push
2. Deploy to Vercel or Railway
3. Test end-to-end with real OpenRouter API key
