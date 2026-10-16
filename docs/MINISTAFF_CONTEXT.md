# MiniStaff AI — Persistent Project Context

Last updated: 2026-10-16 (Asia/Kolkata)

## Current objective
Build MiniStaff AI into a customer-ready multi-tenant dashboard for AI agents, lead intake, appointments, team workspaces, and provider-reported usage. Do not claim production-ready until auth, workspace isolation, live integrations, and release checks pass.

## Repository safety
- Repository: itsmeadityabro-del/ministaff-ai-agent-dashboard
- Working branch: build/ministaff-from-scratch
- Latest verified staging deploy: [38922457975](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38922457975) passed on commit `791c067d6c9daba386204720ddf2dd2bea9e0312`. It deployed the dedicated staging Worker, synced public Supabase settings and server-only Supabase/Agent37 secrets, passed the read-only Agent37 `GET /v1/instances` credential check, verified health, and passed the unauthenticated API JSON 401/no-store smoke test. No Agent37 instance was created.
- Latest successful ordinary CI: [38900824132](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38900824132) passed typecheck, regression/security tests, and production build on commit `791c067d6c9daba386204720ddf2dd2bea9e0312`.
- Keep main and feature/ministaff-sales-desk unchanged unless the user explicitly authorizes changes there.
- Preserve the existing Cloudflare Pages site ministaff-ai.pages.dev and Worker ministaff-forms.
- Do not use Remote Desktop Commander for MiniStaff unless explicitly requested in the current turn.

## Verified Cloudflare staging
- GitHub repository secret CLOUDFLARE_API_TOKEN is configured. Never expose or ask for the raw token.
- Staging Worker: ministaff-ai-dashboard-staging
- Staging URL: https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev
- Latest successful Worker build/deploy/bindings/health/auth-smoke run: https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38899346883
- Latest successful normal CI (typecheck, security regression tests, production build): https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38899346815
- Health endpoint is verified with {"ok":true,"service":"ministaff-ai"}.
- The Worker workflow builds with the Supabase URL and publishable key, then syncs the URL and publishable key as Worker secrets. On run [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927), `Configure server-only Supabase secret key` and `Verify staging health endpoint` both passed.
- The live `/api/leads` unauthenticated smoke test passes with HTTP 401 JSON and `Cache-Control: no-store`, confirming the edge middleware no longer turns API auth failures into HTML login redirects. This is staging, not production. Signup/email, authenticated CRUD, Agent37 runtime, and two-account tenant-isolation end-to-end tests remain open.

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
- Applied migration 0007 `least_privilege_workspace_members`; membership/invitation constraints now allow only `admin` and `member`. Invitation acceptance locks the token row, consumes it once, preserves any existing membership role on conflict, and remains service-role-only.
- Do not reapply these migrations blindly. Check remote migration history before any subsequent schema change.

## Supabase keys and remaining manual credential step
- GitHub Actions secret `SUPABASE_SECRET_KEY` is now configured under the exact name expected by the workflow. The latest successful staging workflow [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927) passed the server-only Supabase key sync step and the staging health check.
- A mistakenly named `SUPABASE` secret may remain; the workflow does not use it. Do not print secret values, paste them into chat, commit them, or expose them to client code.
- The staging Worker has the Supabase URL and public key runtime settings plus a server-only admin secret synced. This is necessary infrastructure but does **not** prove login, signup, data access, or tenant isolation work end to end.
- The user confirmed `AGENT37_API_KEY` is added as a GitHub Actions repository secret. Worker run [38922457975](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38922457975) successfully synced it to the staging Worker as a server-only secret and verified it with a read-only `GET /v1/instances` call; no agent was provisioned. Before any billable test, review Agent37 wallet/billing and obtain an explicit test-spend limit. The lead queue cron secret and auto-triage enable flag remain unset; keep cost-bearing worker behavior disabled until testing is approved.
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
- **Foundation/infrastructure estimate: about 72% complete.** CI is green; Cloudflare staging Worker is deployed and health-checked; Supabase is healthy with seven applied migrations; all eight public tables have RLS enabled and direct browser grants are absent; protected RPCs are service-only; the new member role/invite flow passes CI and deploy.
- **Launch readiness estimate: about 35%.** This is a qualitative estimate, not a promise. Auth/email delivery, Agent37 live runtime, tenant isolation using two real test accounts, usage quota/cost protection, and production/release checks still need live proof.
- Domain purchase is deferred by the user. Keep using the `workers.dev` staging URL. `ministaff.dpdns.org` remains unregistered and its Cloudflare zone is pending.
- Latest CI: [38900824132](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38900824132) passed type-check, security tests, and production build on commit `791c067d6c9daba386204720ddf2dd2bea9e0312`. Latest staging Worker run [38922457975](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38922457975) passed deploy, Agent37 secret sync/read-only credential verification, health, and unauthenticated API JSON 401/no-store smoke tests.
- Security hardening includes service-only RPC grants, atomic first-workspace bootstrap, fail-closed membership checks, safe workspace deletion when agent cleanup fails, verified-email invite details, bounded JSON input (1 MiB overall, 16 KiB lead webhook), no-store JSON responses, baseline security headers, credential/database-error redaction, and regression tests. Invitation roles now default to `member`; admins can explicitly generate admin invitations.
- **Agent37 key status:** `AGENT37_API_KEY` is configured in GitHub Actions and synced to the staging Worker; the read-only credential check passed in [run 38922457975](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38922457975). Next, confirm the allowed test spend before provisioning any Agent37 test instance. Never paste the key into chat.
- Once the credential passes, confirm permitted test spend before creating/waking an agent. Then run the smallest approved Agent37 create/start/chat/delete test. SMTP sender domain/provider, live auth email tests, two-account tenant isolation tests, authoritative quota/cost enforcement, production domain/deploy and rollback testing remain.
- Continue to preserve existing Cloudflare Pages and `ministaff-forms`; update this file and the launch checklist after each substantive change.


## 16. Agent37 credential verification checkpoint — 2026-10-16
- [x] User added `AGENT37_API_KEY` to GitHub Actions repository secrets; no raw credential was shared in chat.
- [x] Manually dispatched Worker workflow run [38922457975](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38922457975) on `build/ministaff-from-scratch`; it completed successfully on commit `791c067d6c9daba386204720ddf2dd2bea9e0312`.
- [x] Agent37 key was synced to Cloudflare staging as a server-only Worker secret. Read-only `GET /v1/instances` authentication/payload validation passed; no agent was created.
- [x] Worker build/deploy, Supabase secret sync, staging `/api/health`, and unauthenticated `/api/leads` JSON 401/no-store checks passed.
- [ ] Before creating/waking an agent, verify provider wallet/billing and obtain an explicit maximum test-spend approval. Auth-email delivery, authenticated CRUD, two-account tenant isolation, quota/cost enforcement, and production release gates remain open.
