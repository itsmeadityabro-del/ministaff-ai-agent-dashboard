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
- Five migrations from supabase/migrations were applied in order and migration history confirmed them:
  1. 0001_init — version 20261016095558
  2. 0002_ministaff_sales_desk — version 20261016095609
  3. 0003_lead_webhooks_and_jobs — version 20261016095616
  4. 0004_lead_job_worker — version 20261016095623
  5. 0005_rpc_privilege_hardening — version 20261016114852
- Verified inventory: 8 public tables (agents, appointments, invitations, lead_jobs, lead_webhook_keys, leads, memberships, workspaces), all 8 have RLS enabled, 15 policies, and the expected workspace/invitation functions. Tables are empty as expected for a new project.
- Audited SECURITY DEFINER functions and found browser roles inherited EXECUTE from PostgreSQL's default PUBLIC grant. Applied migration 0005 to revoke function execution from PUBLIC/anon/authenticated and retain service_role access; live verification confirms all 8 affected functions are non-executable by anon/authenticated, executable by service_role, with zero direct table grants for anon/authenticated.
- Do not reapply these migrations blindly. Check remote migration history before any subsequent schema change.

## Supabase keys and remaining manual credential step
- GitHub Actions secret `SUPABASE_SECRET_KEY` is now configured under the exact name expected by the workflow. The latest successful staging workflow [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927) passed the server-only Supabase key sync step and the staging health check.
- A mistakenly named `SUPABASE` secret may remain; the workflow does not use it. Do not print secret values, paste them into chat, commit them, or expose them to client code.
- The staging Worker has the Supabase URL and public key runtime settings plus a server-only admin secret synced. This is necessary infrastructure but does **not** prove login, signup, data access, or tenant isolation work end to end.
- Agent37 API key is available to the user but has **not been added to GitHub Actions/Cloudflare yet**. The Worker workflow now conditionally syncs the repository secret `AGENT37_API_KEY` into the staging Worker as a server-only secret. User must add it under GitHub repository Settings → Secrets and variables → Actions; then manually rerun `MiniStaff Cloudflare Worker build` because adding a secret does not trigger a push workflow. Never request or expose the raw value in chat. The lead queue cron secret and auto-triage enable flag remain unset; keep the cost-bearing worker disabled until its secret, staging test workspace, and queue tests are ready.
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
- **Foundation/infrastructure estimate: about 65–70% complete.** Branded app routes and major feature foundations exist; CI passes; a Cloudflare staging Worker is deployed and health-checked; the dedicated Supabase project and 4 migrations are applied; RLS is enabled across the 8 public tables; the server-only Supabase key is synced.
- **Launch readiness estimate: about 30–35% complete.** Checklist items are counted separately: 40 of 123 checklist checkboxes are checked at this snapshot (about 33%; a checklist count is not a product-completeness metric). The checklist is conservative because it requires live evidence, not just code.
- Domain purchase is deferred by the user. Keep using the `workers.dev` staging URL for development; the pending Cloudflare zone `ministaff.dpdns.org` is not an owned/registered domain and should not be connected as if it were live.
- Latest independent security hardening: migration 0005 blocks direct browser execution of privileged SECURITY DEFINER RPCs; authorization helper queries now fail closed on database errors; workspace deletion preserves the workspace if agent cleanup fails; removing a workspace member now requires verified membership/admin access and checks the database read-back. GitHub CI passed on commit `b26115a9a29c447b4ed37a17e0874c2489e0ed89` before the Agent37 workflow change. Current CI/Worker validation for the newest workflow sync change is in progress.
- Next priorities independent of purchasing a domain: (1) user adds `AGENT37_API_KEY` to GitHub secrets and reruns the Worker workflow, (2) test Agent37 wallet/billing and do a budget-approved single-agent smoke test, (3) run end-to-end auth and email verification where possible (SMTP remains unconfigured), (4) test tenant isolation with two test accounts/workspaces, (5) test webhook/idempotent queue/appointments, and (6) add authoritative server-side quota and cost protections.
- After the user purchases and owns a domain, configure its separate Cloudflare zone/delegation, a staging custom hostname, and trusted SMTP/sender DNS. Then finish responsive/accessibility, monitoring, backups, legal/support, production deployment, and release/rollback checks.
- Continue updating this file and docs/BUILD_AND_LAUNCH_CHECKLIST.md at every substantive project turn.