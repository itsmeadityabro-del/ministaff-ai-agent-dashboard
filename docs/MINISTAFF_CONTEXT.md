# MiniStaff AI — Persistent Project Context

Last updated: 2026-10-16 (Asia/Kolkata)

## Current objective
Build MiniStaff AI from the existing Agent37 starter repo into a customer-ready multi-tenant dashboard for agents, lead intake, appointments, workspace/team controls, and provider-reported usage. Do not claim production-ready until authentication, tenant isolation, database migrations, live integrations, and production checks have passed.

## Repository safety
- Repository: `itsmeadityabro-del/ministaff-ai-agent-dashboard`
- Working branch: `build/ministaff-from-scratch`
- Latest code commit currently deployed to staging: `c718f43c78bdb6b65783e764eb645652b9d4b208`
- Latest documentation/checklist commit: `0f6476c47d14b21cd46ea0a8cf4f5883193c619f`
- Keep `main` and `feature/ministaff-sales-desk` unchanged unless the user explicitly authorizes changes there.
- Preserve the existing Cloudflare Pages site `ministaff-ai.pages.dev` and Worker `ministaff-forms`.
- Do not use Remote Desktop Commander for MiniStaff tasks unless the user explicitly requests it in the current turn.

## Verified deployment and CI
- Cloudflare repository secret `CLOUDFLARE_API_TOKEN` has been configured by the user; never expose or ask for the raw token.
- Staging Worker: `ministaff-ai-dashboard-staging`
- Staging URL: https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev
- Live `/api/health` response verified as `{"ok":true,"service":"ministaff-ai"}`.
- Worker build + deploy + health check passed: https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38881986997
- Standard CI (typecheck, security regression tests, production build) passed for code commit `c718f43c78bdb6b65783e764eb645652b9d4b208`: https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38881986547
- Health workflow has retries and diagnostics; a first probe briefly returned HTTP 500 then the retry passed.
- Public routes and health do not instantiate a Supabase client when public Supabase config is missing; protected routes still redirect to login. This is a bootstrap safeguard, not proof that auth works.
- Checklist: `docs/BUILD_AND_LAUNCH_CHECKLIST.md`; update it and this context record at each substantive project turn.

## Stack and code status
- Next.js-based app built for Cloudflare Workers with vinext.
- Supabase Auth/Postgres/storage is the intended data/auth layer; migrations exist at `supabase/migrations/0001_init.sql` through `0004_lead_job_worker.sql`.
- Agent37 integration code uses server-only `AGENT37_API_KEY`; key is not configured or live-tested yet.
- Implemented in code: branded public homepage, login/signup/reset UI, workspace/membership controls, Agent37 client, leads/appointments API/UI, inbound lead webhook foundation, durable idempotent lead-job schema, opt-in triage worker code, and provider-usage UI.
- Not yet verified live: email confirmation and recovery, user/session lifecycle, workspace tenant isolation, applying DB migrations, actual lead webhook processing, appointments, quotas (UI usage is not authoritative server-side quota enforcement), Agent37 provisioning/chat, secrets/configuration, production domain and release.
- Dependency audit previously showed no production vulnerabilities, but 7 high findings in dev/build tooling remain; toolchain upgrade remediation needs compatibility testing.

## Supabase blocker — do not write to either project yet
Read-only Composio inventory identified organization `JARVIS` (`ivzdyqrywuvowkmvaxdr`) with two projects in `ap-southeast-2`, both status `INACTIVE`:
1. `itsmeadityabro-del's Project`, ref `fmiouvgarbktkqsubruq`, created 2026-03-28.
2. `Clawhelm`, ref `fzwnybjmbjslftmaetaf`, created 2026-04-07.
- Both returned “No active services available”; migration-history calls timed out. Existing schemas/data cannot currently be verified.
- Neither project has been modified.
- Next essential user decision: resume the generic personal project, resume Clawhelm, or create a separate clean MiniStaff project. Do not assume Clawhelm belongs to MiniStaff and do not apply SQL until this is decided.
- Supabase's dashboard restore flow for a paused project is Dashboard → organization → project → **Resume project**. Projects paused for more than one year may need backup recovery into a new project instead:
  - https://supabase.com/docs/guides/platform/free-project-pausing
  - https://supabase.com/docs/guides/troubleshooting/restore-project-after-90-days-pause

## Secrets policy
- Never paste API keys, tokens, service-role keys, passwords, or webhook secrets into chat or commit them to Git.
- User should add credentials directly to the target platform's secret manager.
- `CLOUDFLARE_API_TOKEN` is already stored in GitHub Actions Secrets.
- Supabase public URL/anon key and server-only service role key are not yet configured on the Worker.
- `AGENT37_API_KEY` and a cron secret are not yet configured on the Worker.

## Immediate next action
Ask the user to choose one Supabase path: (A) resume `itsmeadityabro-del's Project`; (B) resume `Clawhelm`; or (C) create a clean new MiniStaff project. Once chosen, restore/activate it, inspect project metadata and migration history, verify existing tables and data, then apply migrations carefully and configure the Worker environment. Continue to update this file and the build checklist whenever the status changes.
