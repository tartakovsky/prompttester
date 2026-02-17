# Railway + Cloudflare Deployment Setup

**Date:** 2026-02-17 17:39
**Scope:** Infrastructure — Railway project, Cloudflare DNS, deployment config

## Summary
Created Railway project "prompttester" with `web` service, configured Clerk env vars, connected custom domain `prompttester.io`, set up Cloudflare DNS CNAME to Railway.

## Context & Problem
App is built with Clerk auth but had no production deployment. Needed Railway hosting + Cloudflare DNS for `prompttester.io`.

## Decisions Made

### Railway project structure
- **Chose:** Single service `web` with root directory `apps/web`
- **Why:** Monorepo has only one deployable app. Matches autosmm pattern.

### Build/start commands via NIXPACKS env vars
- **Chose:** `NIXPACKS_BUILD_CMD="npm install && npm run build"`, `NIXPACKS_START_CMD="npm start"`
- **Why:** Railway CLI has no direct settings command for build/start. Nixpacks env vars are the standard way to override auto-detection.

### Cloudflare DNS with proxy
- **Chose:** CNAME `prompttester.io` → `9zwks14r.up.railway.app` with Cloudflare proxy enabled
- **Why:** Cloudflare proxy provides CDN, DDoS protection, SSL termination. Standard setup.

### GitHub repo connection
- **Chose:** Manual connection via Railway dashboard (user did this)
- **Why:** Railway CLI `add -r` couldn't find the repo (GitHub integration requires dashboard OAuth). Auto-deploy from `main` is now configured.

## Infrastructure Details

### Railway
- Project ID: `4efa4703-9567-4939-bf51-3fd7ffe6cf01`
- Service: `web` (ID: `67688336-a77d-4f72-949f-17a14de14a92`)
- Environment: production
- Railway domain: `web-production-40f27.up.railway.app`
- Custom domain: `prompttester.io`
- Env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NIXPACKS_BUILD_CMD`, `NIXPACKS_START_CMD`

### Cloudflare
- Zone: `prompttester.io` (ID: `029d041ce8df359bc7c6256902e2f094`)
- Status: pending (nameserver propagation from Namecheap)
- CNAME: `prompttester.io` → `9zwks14r.up.railway.app` (proxied)
- Old Namecheap parking records (A record, www CNAME) deleted

### DNS Propagation
Nameservers changed from Namecheap to Cloudflare. Zone status is "pending" — typically takes 1-24 hours for full propagation.

## Key Files for Context
- `.worklogs/2026-02-17-163859-architecture-overview.md` — full project architecture
- `.worklogs/2026-02-17-165201-clerk-integration.md` — Clerk auth setup details
- `apps/web/.env.local` — Clerk keys (local dev)
