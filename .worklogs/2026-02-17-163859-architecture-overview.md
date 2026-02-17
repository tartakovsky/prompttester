# Prompt Tester — Architecture & Purpose

**Date:** 2026-02-17 16:38
**Scope:** Entire project

## What This Project Is

A standalone web tool for testing and comparing LLM prompts across multiple models simultaneously. You write prompt variants, paste in text content (social media posts, articles, whatever), select models, and run evaluations. The tool calls OpenRouter to evaluate every (prompt × model × post) combination in parallel and displays results in a pivot table.

The core use case: **finding the best prompt + model combination for a specific task** — whether that's scoring content relevance or generating contextual comments.

## Origin

Extracted from the [AutoSMM](https://github.com/tartakovsky/autosmm) project, which is an automated social media monitoring system. AutoSMM has a prompt tester built into its dashboard, but it's tightly coupled to:
- A Java backend (Spring Boot + Restate workflows) for LLM evaluation
- BrightData for scraping social media posts from URLs
- Clerk for authentication
- Brand/platform context for multi-tenant scoping

This standalone version strips all of that away. No Java backend, no scraping, no auth, no multi-tenancy. Just a Next.js app that talks directly to OpenRouter.

## How It Works

### User Flow

1. **Enter API key** — User provides their OpenRouter API key (stored in localStorage, never persisted server-side)
2. **Add posts** — Paste text content into post cards (label + content textarea). These are the texts that will be evaluated.
3. **Write prompt variants** — Create multiple named prompt variants (e.g., "v1 Concise scorer", "v2 Detailed scorer"). Each variant is a system prompt that will be tested.
4. **Select models** — Toggle from 5 default models or add custom OpenRouter model IDs
5. **Configure** — Set test type (scorer vs commenter), thresholds (for scorer), temperature (for commenter)
6. **Run** — Evaluates all variants sequentially; within each variant, all (model × post) pairs run in parallel
7. **View results** — Pivot table with two view modes:
   - **Model-first**: sidebar selects prompt variant, columns = models
   - **Prompt-first**: sidebar selects model, columns = prompt variants

### Two Test Modes

**Scorer mode** — Tests scoring prompts. The LLM returns:
- `score` (0.0–1.0) — how relevant/engaging the post is
- `reasoning` — why it scored that way
- `post_recap` — one-sentence summary
- Actions are computed from thresholds: if score ≥ threshold_like → LIKE, etc.
- Temperature is always 0.0 (deterministic scoring)

**Commenter mode** — Tests comment generation prompts. The LLM returns:
- `comment` — generated comment text
- Temperature is configurable (default 0.7)

### Data Flow

```
Browser (page.tsx)
  │
  │  POST /api/evaluate
  │  Headers: x-api-key: <user's OpenRouter key>
  │  Body: { test_type, prompt, models, posts, thresholds, temperature }
  │
  ▼
API Route (api/evaluate/route.ts)
  │
  │  For each (model, post) pair in parallel:
  │    POST https://openrouter.ai/api/v1/chat/completions
  │    - system message = user's prompt
  │    - user message = post content
  │    - response_format = JSON schema (strict mode)
  │
  ▼
OpenRouter → routes to selected model (Gemini, DeepSeek, Llama, Claude, Qwen, etc.)
  │
  ▼
API Route parses JSON response, computes actions from thresholds
  │
  ▼
Browser displays results in pivot table with cost estimation
```

### Why the API Route Exists (vs. Calling OpenRouter Directly from Browser)

1. **CORS** — OpenRouter's API doesn't allow browser-origin requests
2. **API key safety** — Key passes through our server, never exposed in client-side network requests visible to browser extensions
3. **Future extensibility** — Easy to add rate limiting, caching, or logging at the API layer

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16+ |
| UI | React | 19 |
| Styling | Tailwind CSS | v4 |
| Components | ShadCN/UI | latest |
| Monorepo | Turborepo | 2 |
| LLM API | OpenRouter | v1 |
| State | localStorage | — |
| Auth | None | — |
| Database | None | — |

## Project Structure

```
prompttester/
├── package.json                     # Turborepo root (workspaces: apps/*)
├── turbo.json                       # Build/dev pipeline
├── apps/web/
│   ├── package.json                 # Next.js + Tailwind + ShadCN deps
│   ├── next.config.ts               # Minimal config
│   ├── components.json              # ShadCN CLI config
│   └── src/
│       ├── app/
│       │   ├── layout.tsx           # Root layout, dark mode default
│       │   ├── globals.css          # ShadCN theme (light + dark)
│       │   ├── page.tsx             # THE page — all UI (~900 lines)
│       │   └── api/evaluate/
│       │       └── route.ts         # OpenRouter proxy (~180 lines)
│       ├── components/ui/           # ShadCN: badge, button, input, label, select, separator
│       └── lib/utils.ts             # cn() utility (clsx + tailwind-merge)
└── .worklogs/                       # Decision records
```

## Key Files Explained

### `apps/web/src/app/page.tsx` (~900 lines)

Single-page client component containing everything:

**Types:**
- `ManualPost` — `{ id, label, content }` — user-entered text posts
- `CellResult` — `{ score, reasoning, post_recap, actions, comment, error, input_tokens, output_tokens }` — one evaluation result
- `PromptVariant` — `{ id, name, prompt, results: Record<model, Record<postId, CellResult>> }` — a named prompt with its results

**Inline components:**
- `PromptList` — Vertical list of prompt variants with add/remove/rename/select. Double-click to rename.
- `ModelList` — Vertical list of models (used in prompt-first view mode sidebar)
- `ResultCell` — Renders one cell in the results table. Handles scorer mode (score badge + action badges + reasoning), commenter mode (comment text + expand/collapse), and error states.

**State management:**
- All state in `useState` hooks
- Auto-saved to localStorage on every change
- Loaded from localStorage on mount
- No server-side state whatsoever

**Cache keys** (all prefixed `prompttester:`):
- `apiKey` — OpenRouter API key
- `type` — test type (scorer/commenter)
- `posts` — ManualPost array
- `variants:{testType}` — PromptVariant array per test type
- `models` — selected model IDs
- `customModels` — user-added custom model IDs
- `temperature` — temperature value
- `thresholds` — `{ like, comment, share, save }` threshold values

**Evaluation flow (`runEval`):**
1. Filter variants with non-empty prompts
2. For each variant sequentially:
   - POST to `/api/evaluate` with variant's prompt + all posts + all models
   - On success, store results in variant's `results` field
   - Show progress: "Evaluating v1 Default (1/3)..."
3. 5-minute total timeout via AbortController
4. Per-variant errors are caught and displayed

### `apps/web/src/app/api/evaluate/route.ts` (~180 lines)

Server-side API route that proxies to OpenRouter:

**Input:** `{ test_type, prompt, models, posts, thresholds, temperature }`
**Output:** `{ results: Record<model, Record<postId, CellResult>> }`

**Key implementation details:**
- Reads API key from `x-api-key` header (fallback to `OPENROUTER_API_KEY` env var)
- Fires all (model × post) pairs as parallel promises via `Promise.allSettled()`
- Each pair calls OpenRouter with strict JSON schema (`response_format`)
- Scorer schema: `{ score: number, reasoning: string, post_recap: string }`
- Commenter schema: `{ comment: string }`
- JSON recovery: tries direct parse → strip code fences → extract first JSON object
- Scorer: clamps score to [0, 1], computes actions from thresholds
- Commenter: extracts comment string
- Per-cell error isolation — one model failing doesn't affect others

### `apps/web/src/app/globals.css`

ShadCN theme with CSS custom properties for both light and dark modes. Uses Tailwind v4's `@theme inline` directive. Dark mode is the default (set via `className="dark"` on `<html>`).

## Default Models

Pre-selected on first load:
- `google/gemini-2.0-flash` — Fast, cheap, good JSON adherence
- `deepseek/deepseek-chat-v3` — Strong reasoning, very cheap
- `meta-llama/llama-3.3-70b-instruct` — Open-source baseline
- `anthropic/claude-3.5-haiku` — Fast Claude variant
- `qwen/qwen-2.5-72b-instruct` — Strong multilingual

Users can add any OpenRouter model ID via the custom model input.

## Cost Estimation

The page fetches model pricing from OpenRouter's public `/api/v1/models` endpoint on load. For each model column in the results table footer, it shows:
- Total tokens used (input + output)
- Estimated monthly cost extrapolated from the test: `(cost_per_eval / num_posts) × monthly_volume`
  - Scorer: 10,000 runs/month estimate
  - Commenter: 3,000 runs/month estimate

## Authentication

Uses **Clerk** as a pure gatekeeper — no database, no user table, no server-side user state. Clerk controls who can access the page; everything else is localStorage.

**Pattern:**
- `ClerkProvider` wraps the app in `layout.tsx` with `@clerk/themes` dark theme
- `proxy.ts` (formerly `middleware.ts`, renamed for Next.js 16) runs `clerkMiddleware()` to make `auth()` available server-side
- Page component uses `useAuth()` to check sign-in state: shows `<SignIn withSignUp />` if not authenticated, shows `<PromptTester />` if authenticated
- Layout header shows `<UserButton />` (signed in) or sign-in button with modal dialog (signed out)
- `SignInOrUpDialog` component renders Clerk's `<SignIn withSignUp routing="virtual" />` in a ShadCN Dialog for modal sign-in without page navigation

**No webhook handler** — unlike AutoSMM, there's no user sync to a database. Clerk is the only source of truth for user identity.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key (public, needed at build time) |
| `CLERK_SECRET_KEY` | **Yes** | Clerk secret key (server-side only) |
| `OPENROUTER_API_KEY` | No | Fallback API key if user doesn't provide one via UI |

No database URLs, no inter-service secrets. Just Clerk keys + optional OpenRouter fallback.

## Deployment

### Local Development

```bash
cd ~/Projects/prompttester
npm install
npm run dev
# Opens at http://localhost:3000
```

### Railway (Production)

The project deploys to **Railway** as a single service. Railway auto-deploys from git pushes to `main`.

**Service configuration:**

| Setting | Value |
|---------|-------|
| Service name | `web` |
| Root directory | `apps/web` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Port | `3000` |

**Environment variables on Railway:**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key |
| `CLERK_SECRET_KEY` | **Yes** | Clerk secret key |
| `OPENROUTER_API_KEY` | No | Optional fallback API key. Users can also provide their own key via the UI. |
| `PORT` | No | Railway sets this automatically (defaults to 3000) |

No database, no inter-service communication. Just Clerk + optional OpenRouter fallback.

**Railway CLI** (`railway`) is available for managing the deployment:

```bash
# Check status
railway whoami
railway status

# View logs
railway logs -s web
railway logs -s web --build

# Trigger redeployment from git
railway redeploy --yes

# View/set environment variables
railway variables -s web
```

**CRITICAL: Do NOT use `railway up` to deploy.** Railway is configured to auto-deploy from git. Push to `main` and Railway handles the rest. Using `railway up` breaks deployments by uploading with incorrect root directory structure.

**Deployment flow:**
1. Make changes
2. Commit and push to `main`
3. Railway detects the push, builds `apps/web`, and deploys

### Other deployment options

- **Vercel** — `cd apps/web && npx vercel`
- **Docker** — Standard Next.js Dockerfile
- **Any Node.js host** — `npm run build && npm start` in `apps/web`

## Available Toolchain

The following CLI tools are available and should be used when relevant:

- **GitHub CLI** (`gh`) — repos, PRs, issues
- **Railway CLI** (`railway`) — deployments, logs, variables
- **Node.js / npm** — build, dev, package management
- **Turborepo** (`turbo`) — monorepo task runner (installed as dev dependency)

The project uses **npm workspaces** (not pnpm/yarn). The root `package.json` defines `"workspaces": ["apps/*"]`.

## Build Commands

```bash
# From project root
npm install          # Install all dependencies
npm run dev          # Start dev server (via Turborepo)
npm run build        # Production build (via Turborepo)

# From apps/web directly
cd apps/web
npm run dev          # Next.js dev with Turbopack
npm run build        # Next.js production build
npm run start        # Start production server
```

## Differences from AutoSMM Version

| Feature | AutoSMM | Standalone |
|---------|---------|------------|
| Post input | BrightData URL scraping | Manual text entry |
| LLM calls | Java backend → OpenRouter | Next.js API route → OpenRouter |
| Auth | Clerk | None |
| Scoping | Per-brand, per-platform | Global (single user) |
| Models list | From Java backend config | Hardcoded defaults + custom |
| Platform selector | 6 platforms | None |
| Media enrichment | OCR + transcription | None (text only) |
| Cache keys | Brand + platform scoped | Simple flat keys |
| Database | PostgreSQL | None (localStorage only) |

## Key Files for Context

If you're picking up this project in a new session, read these files:

- `apps/web/src/app/page.tsx` — All UI logic, state, components (auth gate + PromptTester)
- `apps/web/src/app/api/evaluate/route.ts` — OpenRouter integration, evaluation logic
- `apps/web/src/app/layout.tsx` — ClerkProvider, header with auth UI
- `apps/web/src/proxy.ts` — Clerk middleware (makes auth() available server-side)
- `apps/web/src/components/sign-in-or-up-dialog.tsx` — Modal sign-in component
- `apps/web/src/app/globals.css` — Theme configuration
- This worklog — Architecture and purpose overview
