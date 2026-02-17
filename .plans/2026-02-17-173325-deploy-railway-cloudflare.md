# Deploy to Railway + Cloudflare DNS

**Date:** 2026-02-17 17:33
**Task:** Create Railway project, connect GitHub auto-deploy, wire Cloudflare DNS for prompttester.io

## Goal
Production deployment at https://prompttester.io with Railway hosting and Cloudflare DNS.

## Approach

### Step-by-step plan
1. `railway init` — create project "prompttester"
2. Connect GitHub repo for auto-deploy from main
3. Configure service: root dir `apps/web`, build/start commands
4. Set env vars: Clerk keys from .env.local
5. Get Railway domain, add custom domain `prompttester.io`
6. Add CNAME in Cloudflare via API: prompttester.io → Railway domain

## Files to Modify
- None — infrastructure only
