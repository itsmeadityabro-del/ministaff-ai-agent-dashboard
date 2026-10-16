# MiniStaff AI — Persistent Project Context

Last updated: 2026-10-16 (Asia/Kolkata)

## Current objective
Build MiniStaff AI into a customer-ready multi-tenant dashboard for AI agents, lead intake, appointments, team workspaces, and provider-reported usage. Do not claim production-ready until auth, workspace isolation, live integrations, and release checks pass.

## Repository safety
- Repository: itsmeadityabro-del/ministaff-ai-agent-dashboard
- Working branch: build/ministaff-from-scratch
- Latest relevant app source commit deployed to staging: 6f522e7f8ccc5ae048c0296771d26358f6d3e42c
- Latest successful ordinary CI on docs/env example commit: 38884159683 (head c4bf46d00b78b8c2dca5aa70fac063986ef247c6)
- Keep main and feature/ministaff-sales-desk unchanged unless the user explicitly authorizes changes there.
- Preserve the existing Cloudflare Pages site ministaff-ai.pages.dev and Worker ministaff-forms.
- Do not use Remote Desktop Commander for MiniStaff unless explicitly requested in the current turn.

## Verified Cloudflare staging
- GitHub repository secret CLOUDFLARE_API_TOKEN is configured. Never expose or ask for the raw token.
- Staging Worker: ministaff-ai-dashboard-staging
- Staging URL: https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev
- Latest successful Worker build/deploy/public-Supabase-bindings/health-check run: https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884117058
- Latest successful normal CI (typecheck, security regression tests, Next build): https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884159683
- Health endpoint is verified with {"ok":true,"service":"ministaff-ai"}.
- The Worker workflow now builds with the Supabase URL and publishable key; after deployment it syncs the URL and publishable key as Worker secrets. The privileged runtime key step is intentionally pending until SUPABASE_SECRET_KEY exists as a GitHub repository secret.
- This is staging, not production. No live sign-up, confirmation email, login, data writes, Agent37 or tenant-isolation end-to-end test has passed yet.

## Fresh Supabase project — created and migrated
- Organization: JARVIS (organization ID ivzdyqrywuvowkmvaxdr)
- Project name: ministaff-ai
- Project ref: qgxjjvhzggepfurjtpyd
- Project URL: https://qgxjjvhzggepfurjtpyd.supabase.co
- Region: ap-south-1 (Mumbai, India)
- Status: ACTIVE_HEALTHY; all listed services reported healthy.
- This is a new, dedicated MiniStaff project. Neither older inactive project was modified.
- All four migrations from supabase/migrations were applied in order and migration history confirmed them:
  1. 0001_init — version 20261016095558
  2. 0002_ministaff_sales_desk — version 20261016095609
  3. 0003_lead_webhooks_and_jobs — version 20261016095616
  4. 0004_lead_job_worker — version 20261016095623
- Verified inventory: 8 public tables (agents, appointments, invitations, lead_jobs, lead_webhook_keys, leads, memberships, workspaces), all 8 have RLS enabled, 15 policies, and the expected workspace/invitation functions. Tables are empty as expected for a new project.
- Do not reapply these migrations blindly. Check remote migration history before any subsequent schema change.

## Supabase keys and remaining manual credential step
- Stored in GitHub Actions Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy compatibility), and SUPABASE_DB_PASSWORD.
- The Cloudflare workflow successfully synced NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the staging Worker.
- REQUIRED manual action: add the current Supabase secret API key to GitHub Actions Secrets with the exact name SUPABASE_SECRET_KEY. Use the project dashboard Settings → API Keys → Secret keys → default key: https://supabase.com/dashboard/project/qgxjjvhzggepfurjtpyd/settings/api-keys . Copy the secret key directly from Supabase into GitHub's secret field. Never paste it into chat, commit it, or expose it to client code.
- After SUPABASE_SECRET_KEY is added, manually dispatch the Cloudflare Worker workflow (or tell the assistant “secret added” so it can dispatch it). The workflow syncs it to Cloudflare as the server-only SUPABASE_SECRET_KEY. Until then, the admin client and server-side data operations remain unconfigured.
- Application code prefers the current Supabase publishable key on client/session clients, while retaining NEXT_PUBLIC_SUPABASE_ANON_KEY as a legacy fallback. The server-only admin client prefers SUPABASE_SECRET_KEY, with SUPABASE_SERVICE_ROLE_KEY as a migration fallback.
- Do not disable or revoke any current Supabase keys during this migration.
- Agent37 API key and the lead queue cron secret have not been configured.

## Code already present
- Branded public homepage, signup/signin/password-reset UI, callback and invitation paths.
- Workspace/membership checks and a server-side Supabase admin client.
- Agent37 client, agent lifecycle and usage UI.
- Leads and appointment APIs/UI, inbound lead webhook foundation, durable idempotent job schema, opt-in lead triage worker.
- Provider-reported usage display, but no authoritative monthly quota enforcement yet.
- Production dependency audit previously reported no production dependencies with critical/high vulnerabilities; 7 high findings remain in development/build tooling and should be remediated with compatibility retesting.

## Immediate next action
1. User adds SUPABASE_SECRET_KEY directly in GitHub Settings → Secrets and variables → Actions.
2. Rerun the staging Worker workflow and confirm the secret sync/health check.
3. Run live signup, email-verification, callback, login/logout, password-recovery, workspace-creation, authorization, and workspace-isolation tests.
4. Then configure Agent37 as a server-side secret, check wallet/billing status, and test only a budget-approved test instance.
5. Continue updating this file and docs/BUILD_AND_LAUNCH_CHECKLIST.md at every substantive project turn.
