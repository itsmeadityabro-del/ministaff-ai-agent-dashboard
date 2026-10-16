# MiniStaff AI — Persistent Project Context

Last updated: 2026-10-16 (Asia/Kolkata)

## Current objective
Build MiniStaff AI into a customer-ready multi-tenant dashboard for AI agents, lead intake, appointments, team workspaces, and provider-reported usage. Do not claim production-ready until auth, workspace isolation, live integrations, and release checks pass.

## Repository safety
- Repository: itsmeadityabro-del/ministaff-ai-agent-dashboard
- Working branch: build/ministaff-from-scratch
- Latest verified staging deploy run: [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927) succeeded on branch `build/ministaff-from-scratch`; the server-only Supabase key sync step and staging health probe both passed. Build head was `99abee47829c6cad64b5c73b32592662c619ce28`.
- Latest successful ordinary CI: [38886945020](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38886945020) on commit `99abee47829c6cad64b5c73b32592662c619ce28`.
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
- All four migrations from supabase/migrations were applied in order and migration history confirmed them:
  1. 0001_init — version 20261016095558
  2. 0002_ministaff_sales_desk — version 20261016095609
  3. 0003_lead_webhooks_and_jobs — version 20261016095616
  4. 0004_lead_job_worker — version 20261016095623
- Verified inventory: 8 public tables (agents, appointments, invitations, lead_jobs, lead_webhook_keys, leads, memberships, workspaces), all 8 have RLS enabled, 15 policies, and the expected workspace/invitation functions. Tables are empty as expected for a new project.
- Do not reapply these migrations blindly. Check remote migration history before any subsequent schema change.

## Supabase keys and remaining manual credential step
- Verified GitHub Actions secret names currently present: `CLOUDFLARE_API_TOKEN`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy compatibility), `SUPABASE_DB_PASSWORD`, and `SUPABASE`. The newly added `SUPABASE` name is not read by the workflow: both `SUPABASE_SECRET_KEY` and legacy `SUPABASE_SERVICE_ROLE_KEY` are still absent.
- The Cloudflare workflow synced public Supabase settings and the server-only key to the staging Worker on run [38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927); the server-key step no longer skips.
- REQUIRED manual action remains: add the existing value again as a GitHub Actions secret named exactly `SUPABASE_SECRET_KEY`. `SUPABASE` is not an alias, so the workflow cannot read it under the required name. Use the Supabase project's Settings → API Keys → Secret keys page: https://supabase.com/dashboard/project/qgxjjvhzggepfurjtpyd/settings/api-keys . Never paste the value into chat, commit it, or expose it to client code; the existing `SUPABASE` entry may remain for now.
- After the correctly named `SUPABASE_SECRET_KEY` exists, verify its name and dispatch the Cloudflare Worker workflow. Do not dispatch yet: with only `SUPABASE` present, the privileged sync step will be skipped. Until the expected key name exists, admin-backed data operations remain unconfigured.
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

## Domain decision for MiniStaff email setup
- User asked to obtain a domain from https://github.com/DigitalPlatDev/FreeDomain for MiniStaff SMTP. The project's official README lists suffixes `.dpdns.org`, `.us.kg`, `.qzz.io`, `.xx.kg`, and `.qd.je` and links to the registration dashboard at https://dash.domain.digitalplat.org/ (README: https://github.com/DigitalPlatDev/FreeDomain/blob/main/README.md).
- Preferred candidate to check first: `ministaff.dpdns.org`; this is only a proposed name, not confirmed available or registered.
- DigitalPlat's own registration guide says to read the dashboard's current notices/policies and confirm current suffix support, availability, nameservers, slots, and any price before submitting; prepare an external DNS zone first. Cloudflare can be the intended external DNS provider, but do not create a zone or submit registration until the dashboard availability/policy result confirms the exact chosen name and no unexpected charge.
- The dashboard fetch returned 403 in the available read-only web route. On 2026-10-16, at the user's explicit request, opened the official DigitalPlat dashboard `https://dash.domain.digitalplat.org/` in the user's connected Windows browser using Remote Desktop Commander. Registration has not occurred. Next step: the user signs in on their PC, checks the live Register-page details/name availability and current policy, then shares a screenshot with email/account details hidden. Never request or share passwords or authentication codes. Never use DigitalPlat's compromised former Telegram channels; the repository warns against them.

## Current auth workstream
- Current active workstream: email delivery and authentication. Supabase Auth service was rechecked on 2026-10-16 and is ACTIVE_HEALTHY; email/password signup is enabled, email auto-confirm is disabled, the staging site URL and redirect allowlist are configured, and password minimum is 8. SMTP host/port/username/password/sender are still unset. Next dependency: user must choose a sender domain they control (or use limited internal-only default-SMTP testing) before configuring delivery; never request credentials in chat.

## Immediate next action
1. Complete DigitalPlat dashboard availability/policy check for proposed `ministaff.dpdns.org`; do not claim registration until confirmed in Domain List.
2. Prepare a DNS zone at the connected Cloudflare account and use the exact assigned nameservers during registration/delegation, after confirming the suffix's current rules and any displayed charge.
3. Configure trusted SMTP/email sending after domain/DNS ownership and required email DNS records are verified.
4. Run live signup, email verification, callback, sign-in/out, password-recovery, workspace creation, permissions, and tenant-isolation tests.
5. Then configure Agent37 as a server-side secret, check wallet/billing status, and test only a budget-approved test instance.
6. Continue updating this file and docs/BUILD_AND_LAUNCH_CHECKLIST.md at every substantive project turn.


## DigitalPlat registration checkpoint — 2026-10-16
- The user confirmed this is the DigitalPlat account to use for MiniStaff and confirmed they are authorized to manage it.
- The live registration page showed 1 free domain slot, 0 paid slots, and 0 plan slots. It requires reading/acknowledging policies before submission. The dashboard notice says .US.KG and .XX.KG registrations are temporarily paused for accounts below Power.
- The intended candidate remains `ministaff.dpdns.org`; name availability and permitted suffix must be checked in the authenticated UI. Official DigitalPlat guidance says to prepare an external DNS zone first and use the exact nameservers assigned by the DNS provider.
- User requested completion of registration. No terms have been accepted, no registration submitted, no domain purchased, and no DNS changes made yet. Candidate remains unverified and unregistered.
