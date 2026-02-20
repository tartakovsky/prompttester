# Prompt Tester — Agent Instructions

> **This is an agent-managed codebase.** The user does not read or write code directly. Your role is to own the code end-to-end. Never say "you can edit X" — just do it. Never estimate workload — just execute.

## What This Project Does

Prompt Tester is a tool for testing and comparing LLM prompts across multiple models via OpenRouter. Users create inputs, write system prompts, select models, and run evaluations to compare outputs, token usage, and cost side by side. All test data is stored in the browser via localStorage.

## Architecture Overview

This is a **TypeScript monorepo** deployed on **Railway**. No backend server — the web app calls OpenRouter directly via API routes. The landing page is a separate Next.js app.

```
project/
├── apps/
│   ├── web/                       # Next.js 16 (prompt tester UI, API routes)
│   └── landing/                   # Next.js 16 (marketing site)
│
├── packages/
│   └── types/                     # Shared TypeScript types + Zod schemas
│
├── .githooks/pre-commit           # Enforces all rules at commit time
├── eslint.config.mjs              # Architecture enforcement (import boundaries, dependency bans)
├── tsconfig.base.json             # Shared TypeScript config
└── CLAUDE.md                      # This file
```

### Zone Architecture (within each Next.js app)

```
src/
├── app/           # Routes (pages + API routes) — composition root, can import from anything
├── components/    # React components — can import from lib/, types/ only
├── lib/           # Shared utilities, auth, clients — can import from types/
├── services/      # Business logic — can import from lib/, types/
└── types/         # Type definitions + Zod schemas — leaf node, imports nothing
```

### What can import what

| Zone | Can import from | Cannot import from |
|------|----------------|-------------------|
| `app/` | Everything | — |
| `components/` | `lib/`, `types/`, `content/` (type-only) | `db/`, `services/`, `app/` |
| `services/` | `lib/`, `types/` | `components/`, `app/` |
| `lib/` | `types/` | `components/`, `app/`, `services/` |
| `types/` | Nothing | Everything else |

These boundaries are **enforced by ESLint** (`eslint-plugin-boundaries`) and checked by the **pre-commit hook**.

## Service Inventory

| Service | Technology | Deployment | Port |
|---------|-----------|------------|------|
| web | Next.js 16 | Railway (git push to main) | 3010 |
| landing | Next.js 16 | Railway (git push to main) | 3011 |

## How to Add an API Route

Every API route goes through a wrapper function. You cannot export raw handler functions — ESLint will reject the commit.

```typescript
// Authenticated route with body validation
export const POST = withBody(EvaluateRequestSchema, async (data, req, userId, ctx) => {
  return NextResponse.json(result);
});

// Public route with body validation (no auth)
export const POST = withPublicBody(WebhookSchema, async (data, req, ctx) => {
  return NextResponse.json({ ok: true });
});
```

**Wrapper reference:**
- `withBody(schema, handler)` — POST/PUT/PATCH with Zod validation + Clerk auth
- `withRoute(handler)` — GET/DELETE with Clerk auth, no body
- `withPublicBody(schema, handler)` — POST without auth
- `withPublicRoute(handler)` — GET without auth

## How to Edit Landing Page Content

The landing site uses a schema-first content pipeline:

1. **Schemas** in `apps/landing/src/content/landing/schemas.ts` — Zod schemas define shape + constraints
2. **Types** in `types.ts` — derived via `z.infer<>`
3. **Content** in `content.ts` — actual copy matching the schema
4. **Parse gate** in `index.ts` — `LandingPageSchema.parse()` runs at build time

Components import ONLY from `index.ts` gate. ESLint enforces this.

## Environment Variables

### web (Next.js)

| Variable | Required | Description |
|----------|----------|-------------|
| CLERK_SECRET_KEY | Yes | Clerk authentication |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Yes | Clerk client-side key |
| OPENROUTER_API_KEY | No | Fallback API key for OpenRouter |

Direct `process.env` access is banned by ESLint — import `env()` from `@/lib/env` instead.

## Authentication

Uses **Clerk** for authentication (email + code, single SignIn dialog). Auth is enforced in API route wrappers via `requireAuth()` which calls Clerk's `auth()`.

## Don'ts

1. **Don't import across apps.** `apps/web` cannot import from `apps/landing`.
2. **Don't bypass route wrappers.** All API routes use `withBody`/`withRoute` from `@/lib/api`.
3. **Don't use `process.env` directly.** Import `env()` from `@/lib/env`.
4. **Don't install banned packages.** No axios, lodash, moment, uuid, raw pg, Embla.
5. **Don't commit secrets.** Use environment variables.
6. **Don't `git add .`** — stage specific files.
7. **Don't force push to main.**
8. **Don't throw raw strings.** Always `throw new Error(...)`.
9. **Don't leave empty catch blocks.**
10. **Don't create Dockerfiles.** Railway deploys via Nixpacks.
11. **Don't run `railway up`.** Push to `main` to deploy.
12. **Don't import from `content.ts` directly in landing app.** Use the `index.ts` gate.
13. **Don't build custom UI when shadcn provides it.**
14. **Don't use inline styles or CSS modules.** Use Tailwind utilities + `cn()`.
15. **Don't edit files in `components/ui/`.** Wrap them if customization needed.

## UI Components — shadcn/ui Required

All UI uses **shadcn/ui** with **Tailwind CSS v4**. Install via `npx shadcn@latest add <component>`. Use `cn()` for class merging. Use `lucide-react` for icons.

## Pre-Commit Hook

Checks: secret scanning, file size limits, TypeScript type checking, ESLint validation.

## Build Commands

```bash
npm install          # Install all workspaces
npm run build        # Build all apps
npm run lint         # ESLint all apps
npm run typecheck    # TypeScript check all apps
```
