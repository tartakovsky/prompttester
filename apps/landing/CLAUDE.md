# Landing — Prompt Tester

## What This App Is

Marketing landing page for Prompt Tester. No database, no auth. Content validated at build time via Zod parse gate.

## Content Pipeline

```
schemas.ts → types.ts → content.ts → index.ts (parse gate) → components
```

Components import ONLY from `@/content/landing` (index.ts gate). ESLint bans direct `content.ts` imports.

## Blocks

1. Hero — badge, two-line title, body, CTA, helper text
2. Features — "How it works" with 3 cards
3. Trust — 3 centered items with emoji
4. Final CTA — title, body, CTA button
5. Footer — tagline

## Adding a block

1. Add Zod schema to `schemas.ts`
2. Add inferred type to `types.ts`
3. Add field to `LandingPageSchema`
4. Add content in `content.ts`
5. Create component in `components/landing/`
6. Add to `page.tsx`
