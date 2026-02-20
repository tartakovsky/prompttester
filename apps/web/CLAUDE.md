# Web App — Prompt Tester

## What This App Is

Next.js 16 web application for testing and comparing LLM prompts across models. Uses Clerk for auth, OpenRouter for LLM calls, and localStorage for persistence. No database.

## Zone Architecture

```
src/
├── app/           # Routes (pages + API routes) — composition root
├── components/    # React components — can import from lib/, types/ only
├── services/      # Business logic (OpenRouter calls) — can import from lib/, types/
├── lib/           # Shared utilities, auth, API wrappers — can import from types/
└── types/         # Zod schemas + TypeScript types — leaf node
```

## API Routes — Must Use Wrappers

All routes must use wrappers from `@/lib/api`. Auth uses Clerk's `auth()`.

## Environment Variables

Use `env()` from `@/lib/env`. Direct `process.env` banned by ESLint.

| Variable | Required | Description |
|----------|----------|-------------|
| CLERK_SECRET_KEY | Yes | Clerk authentication |
| OPENROUTER_API_KEY | No | Fallback API key |

## Key Architecture Decisions

- **No database** — all state in localStorage with `prompttester:` prefix
- **API key from client** — user provides their OpenRouter API key, passed via `x-api-key` header
- **Single page app** — one page with test management, input/prompt/model editing, evaluation, results grid
