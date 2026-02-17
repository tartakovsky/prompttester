# Add Clerk Auth

**Date:** 2026-02-17 16:52
**Scope:** `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, `apps/web/src/proxy.ts`, `apps/web/src/components/sign-in-or-up-dialog.tsx`

## Summary
Added Clerk authentication as a pure gatekeeper. No database — API key and all settings remain in localStorage. Unauthenticated users see a sign-in page; authenticated users see the prompt tester with a UserButton in the header.

## Decisions Made

### Client-side route protection
- **Chose:** `useAuth()` check in page component + `<SignedIn>`/`<SignedOut>` in layout
- **Why:** Matches AutoSMM pattern. No server-side middleware guards — simpler, and the tool has no sensitive server-side data to protect.

### proxy.ts instead of middleware.ts
- **Chose:** `proxy.ts` naming
- **Why:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts`. Same `clerkMiddleware()` call.

### Dark theme for Clerk components
- **Chose:** `@clerk/themes` dark base theme
- **Why:** App defaults to dark mode. Clerk components need to match.

## Environment Variables Required
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (public)
- `CLERK_SECRET_KEY` — Clerk secret key (server-side only)

## Key Files
- `apps/web/src/app/layout.tsx` — ClerkProvider wrapper, header with UserButton/SignIn
- `apps/web/src/proxy.ts` — clerkMiddleware() for server-side auth() availability
- `apps/web/src/components/sign-in-or-up-dialog.tsx` — Modal sign-in with `<SignIn withSignUp routing="virtual" />`
- `apps/web/src/app/page.tsx` — Auth gate: `useAuth()` → show SignIn or PromptTester
