# Add Clerk Auth to Prompt Tester

**Date:** 2026-02-17 16:49
**Task:** Add Clerk authentication — gate page access, no DB needed

## Approach
1. Install `@clerk/nextjs`
2. Wrap layout in `ClerkProvider`, add `export const dynamic = 'force-dynamic'`
3. Add `middleware.ts` with `clerkMiddleware()`
4. Home page (`/`): show `<SignIn withSignUp />` if not signed in, show prompt tester if signed in
5. Add Dialog-based sign-in component for header
6. Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
7. No webhook, no DB sync — Clerk is pure gatekeeper

## Files to Modify
- `apps/web/package.json` — add @clerk/nextjs
- `apps/web/src/app/layout.tsx` — ClerkProvider wrapper, SignedIn/SignedOut nav
- `apps/web/src/middleware.ts` — clerkMiddleware()
- `apps/web/src/app/page.tsx` — gate behind SignedIn, show SignIn for SignedOut
