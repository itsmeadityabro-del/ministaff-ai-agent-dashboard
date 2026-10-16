# MiniStaff AI — Persistent Project Context

Last updated: 2026-10-16 (Asia/Kolkata)

## Current objective
Build MiniStaff AI into a customer-ready multi-tenant dashboard for AI agents, lead intake, appointments, team workspaces, and provider-reported usage. Do not claim production-ready until auth, workspace isolation, live integrations, and release checks pass.

## Repository safety
- Repository: itsmeadityabro-del/ministaff-ai-agent-dashboard
- Working branch: build/ministaff-from-scratch
- Latest verified staging deploy run: [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927) succeeded on branch `build/ministaff-from-scratch`; server-only Supabase key sync and staging health probe both passed.
- Latest successful ordinary CI: [38892741258](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38892741258) on current branch head `be5beae1363ed9c55598e432ee9eae004870d975` (TypeScript typecheck, security regression tests, production build).
- Keep main and feature/ministaff-sales-desk unchanged unless the user explicitly authorizes changes there.
- Preserve the existing Cloudflare Pages site ministaff-ai.pages.dev and Worker ministaff-forms.
- Do not use Remote Desktop Commander for MiniStaff unless explicitly requested in the current turn.

## Verified Cloudflare staging
- GitHub repository secret CLOUDFLARE_API_TOKEN is configured. Never expose or ask for the raw token.
- Staging Worker: ministaff-ai-dashboard-staging
- Staging URL: https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev
- Latest successful Worker build/deploy/public-Supabase-bindings/health-check run: https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884117058
- Latest successful normal CI (typecheck, security regression tests, Next build): https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884691642
- Health endpoint is verified with {"ok":true,"service":"ministaff-ai"}.
- The Worker workflow builds with the Supabase URL and publishable key, then syncs the URL and publishable key as Worker secrets. On run [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927), `Configure server-only Supabase secret key` and `Verify staging health endpoint` both passed.
- This is staging, not production. No live sign-up, confirmation email, login, data writes, Agent37 or tenant-isolation end-to-end test has passed yet.

## Fresh Supabase project — created and migrated
- Organization: JARVIS (organization ID ivzdyqrywuvowkmvaxdr)
- Project name: ministaff-ai
- Project ref: qgxjjvhzggepfurjtpyd
- Project URL: https://qgxjjvhzggepfurjtpyd.supabase.co
- Region: ap-south-1 (Mumbai, India)
- Status: ACTIVE_HEALTHY; all listed services reported healthy.
- Auth site URL is the staging Worker URL; redirect allowlist includes staging callback paths and localhost development paths. Supabase password minimum is set to 8 characters, matching the app.
- Email/password signup is enabled and email auto-confirm is disabled, so email verification is required. Custom SMTP/sender is not configured yet; reliable confirmation and reset email delivery remains unverified.
- This is a new, dedicated MiniStaff project. Neither older inactive project was modified.
- Six migrations from supabase/migrations were applied in order and migration history confirmed them:
  1. 0001_init — version 20261016095558
  2. 0002_ministaff_sales_desk — version 20261016095609
  3. 0003_lead_webhooks_and_jobs — version 20261016095616
  4. 0004_lead_job_worker — version 20261016095623
  5. 0005_rpc_privilege_hardening — version 20261016114852
  6. 0006_idempotent_workspace_bootstrap — version 20261016120115
- Verified inventory: 8 public tables (agents, appointments, invitations, lead_jobs, lead_webhook_keys, leads, memberships, workspaces), all 8 have RLS enabled, 15 policies, and the expected workspace/invitation functions. Tables are empty as expected for a new project.
- Audited SECURITY DEFINER functions and found browser roles inherited EXECUTE from PostgreSQL's default PUBLIC grant. Applied migration 0005 to revoke function execution from PUBLIC/anon/authenticated and retain service_role access; live verification confirms all 8 affected functions are non-executable by anon/authenticated, executable by service_role, with zero direct table grants for anon/authenticated.
- Applied migration 0006 `ensure_default_workspace(uuid)`, which uses a transaction-scoped per-user advisory lock to prevent simultaneous first-login requests from creating duplicate default workspaces. Live SQL confirms the RPC is not executable by anon/authenticated and remains executable by service_role.
- Do not reapply these migrations blindly. Check remote migration history before any subsequent schema change.

## Supabase keys and remaining manual credential step
- GitHub Actions secret `SUPABASE_SECRET_KEY` is now configured under the exact name expected by the workflow. The latest successful staging workflow [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927) passed the server-only Supabase key sync step and the staging health check.
- A mistakenly named `SUPABASE` secret may remain; the workflow does not use it. Do not print secret values, paste them into chat, commit them, or expose them to client code.
- The staging Worker has the Supabase URL and public key runtime settings plus a server-only admin secret synced. This is necessary infrastructure but does **not** prove login, signup, data access, or tenant isolation work end to end.
- Agent37 API key is available to the user but has **not been added to GitHub Actions/Cloudflare yet**. The Worker workflow now conditionally syncs the repository secret `AGENT37_API_KEY` into the staging Worker as a server-only secret and verifies it with a read-only `GET /v1/instances` request without logging the response. Latest verified Worker run skipped the key sync and reported the key missing, confirming the repository secret still needs to be added. User must add it under GitHub repository Settings → Secrets and variables → Actions; then manually rerun `MiniStaff Cloudflare Worker build` because adding a secret does not trigger a push workflow. Never request or expose the raw value in chat. The lead queue cron secret and auto-triage enable flag remain unset; keep the cost-bearing worker disabled until its secret, staging test workspace, and queue tests are ready.
- Do not disable or revoke any current Supabase keys during the migration.

## Code already present
- Branded public homepage, signup/signin/password-reset UI, callback and invitation paths.
- Workspace/membership checks and a server-side Supabase admin client.
- Agent37 client, agent lifecycle and usage UI.
- Leads and appointment APIs/UI, inbound lead webhook foundation, durable idempotent job schema, opt-in lead triage worker.
- Provider-reported usage display, but no authoritative monthly quota enforcement yet.
- Production dependency audit previously reported no production dependencies with critical/high vulnerabilities; 7 high findings remain in development/build tooling and should be remediated with compatibility retesting.

## Domain decision for MiniStaff email setup
- User asked to obtain a domain from https://github.com/DigitalPlatDev/FreeDomain for MiniStaff SMTP. The project's official README lists suffixes `.dpdns.org`, `.us.kg`, `.qzz.io`, `.xx.kg`, and `.qd.je` and links to the registration dashboard at https://dash.domain.digitalplat.org/ (README: https://github.com/DigitalPlatDev/FreeDomain/blob/main/README.md).
- Preferred candidate to check first: `ministaff.dpdns.org`; this is only a proposed name, not confirmed available or registered.
- DigitalPlat's own registration guide says to read the dashboard's current notices/policies and confirm current suffix support, availability, nameservers, slots, and any price before submitting; prepare an external DNS zone first. Cloudflare can be the intended external DNS provider, but do not create a zone or submit registration until the dashboard availability/policy result confirms the exact chosen name and no unexpected charge.
- The dashboard fetch returned 403 in the available read-only web route. On 2026-10-16, at the user's explicit request, opened the official DigitalPlat dashboard `https://dash.domain.digitalplat.org/` in the user's connected Windows browser using Remote Desktop Commander. Registration has not occurred. Next step: the user signs in on their PC, checks the live Register-page details/name availability and current policy, then shares a screenshot with email/account details hidden. Never request or share passwords or authentication codes. Never use DigitalPlat's compromised former Telegram channels; the repository warns against them.

## Current auth workstream
- Current active workstream: email delivery and authentication. Supabase Auth service was rechecked on 2026-10-16 and is ACTIVE_HEALTHY; email/password signup is enabled, email auto-confirm is disabled, the staging site URL and redirect allowlist are configured, and password minimum is 8. SMTP host/port/username/password/sender are still unset. Next dependency: user must choose a sender domain they control (or use limited internal-only default-SMTP testing) before configuring delivery; never request credentials in chat.

## Current progress and immediate next actions
- **Foundation/infrastructure estimate: about 70% complete.** Branded app routes and major feature foundations exist; latest CI is green; the Cloudflare staging Worker is deployed and health-checked; Supabase is healthy with six applied migrations and all eight public tables RLS-enabled; server-only Supabase secret is synced.
- **Launch readiness estimate: about 30–35%.** Main integrations still require end-to-end acceptance evidence. Checklist completion percentage is a task count, not a claim that the product is customer-ready.
- Domain purchase is deferred by the user. Keep using the `workers.dev` staging URL. `ministaff.dpdns.org` remains unregistered; its Cloudflare zone is pending and must not be treated as an owned/live hostname.
- Latest verified CI: [run 38898242393](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38898242393) passed type-check, security regression tests, and production build for commit `8a32e2a1d514e0dd9b41cde49c323d8615a98e99`. Latest verified staging Worker build/deploy/health check: [run 38898232362](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38898232362) succeeded; it intentionally skipped Agent37 secret sync/verification because the repository secret is not yet present.
- Security hardening now includes: migration 0005 service-role-only RPC grants, migration 0006 atomic/idempotent first-workspace bootstrap, fail-closed workspace/agent lookup checks, safe agent cleanup before workspace deletion, membership checks before member removal and verified-email checks before viewing invite details; JSON request bodies are bounded to 1 MiB by default and 16 KiB for inbound lead webhooks; API JSON responses set `Cache-Control: no-store`; baseline security headers are applied; database diagnostics/provider credentials are redacted from API errors.
- The billable Agent37 smoke script now requires explicit `--budget-approved`, and keeping an instance also requires `--keep-approved`. We will not create/wake agents until the user confirms an allowable test spend.
- **Immediate user step:** add `AGENT37_API_KEY` under the repository's GitHub Actions secrets, then manually rerun `MiniStaff Cloudflare Worker build`. The workflow syncs it as a server-side Worker secret and performs a read-only `GET /v1/instances` check without logging response contents. Never paste the raw key into chat.
- Once the read-only key check passes, confirm the test budget before provisioning a test agent. After that: run the Agent37 create/start/chat/delete smoke; complete auth/email verification and password reset once a sender domain/SMTP provider is configured; test tenant isolation with two test accounts/workspaces; test webhook/queue/appointments; then enforce quota/cost controls and final launch gates.
- After the user purchases a domain and selects a sender provider, configure its separate Cloudflare zone/delegation, staging hostname, SMTP sender DNS, and Supabase SMTP, then validate email delivery. Keep the existing Pages site and `ministaff-forms` Worker untouched.
- Continue updating this file and `docs/BUILD_AND_LAUNCH_CHECKLIST.md` at every substantive project turn.
