# MiniStaff AI — Build, Login, Website & Release Checklist

**Branch:** `build/ministaff-from-scratch`  
**Rule:** A box is checked only when the named verification has actually passed. Code existing in the repository is not proof that a live integration or production deployment works.

## Current evidence and blockers

- [x] Created an isolated rebuild branch; the existing sales-desk branch and default branch remain untouched.
- [x] Installed the locked dependencies in a cloud coding workspace with `npm ci`.
- [x] Inspected the repository and kept the pre-existing sales-desk/default branches untouched.
- [x] The rebuild branch passes `npm ci`, TypeScript `npm run typecheck`, `npm run test:security`, and the Next.js production build on GitHub Actions for commit `a931f71fcc23cb0ba14079c12966971c02f66ee6` ([CI run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38864758983)).
- [x] Added a branded marketing site, signup entry links, metadata/app icon, robots policy, branded 404, `/api/health`, redirect regression tests, and guarded lead triage queue worker code.
- [x] Reviewed the dependency audit in the latest successful Worker build run [38874231795](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38874231795): 7 high findings remain in build/development tooling, 0 critical findings, and `npm audit --omit=dev` reports 0 production dependency vulnerabilities. The Worker workflow fails closed if the production audit report is invalid or if production dependencies have critical/high findings; the latest run passed with a valid zero-vulnerability report. Proposed toolchain fixes require semver-major changes, so remediation and compatibility retesting remain open.
- [x] Deployment decision corrected: do not use Vercel Hobby for commercial MiniStaff. Use Cloudflare for this app instead.
- [x] Located Cloudflare Pages project `ministaff-ai.pages.dev`; its current `dist` configuration is static output and is not evidence that the Next.js server routes run there.
- [x] Ran Cloudflare's official vinext compatibility scanner in the isolated cloud checkout: 100% reported compatibility (14 supported, 0 partial, 0 issues). This scan is not a runtime build or deployment pass.
- [x] Verified the full vinext/Cloudflare Worker production build, production-dependency audit gate, and dry-run deploy validation on GitHub Actions with Node 22 at code commit `ed29080d2bc676d492b49f5e6bc3c0e73a9875d3`: Worker build run [38874231795](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38874231795), ordinary CI run [38874231829](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38874231829). Both passed; artifact [12034302642](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38874231795/artifacts/12034302642) contains the generated Worker output and audit reports. This verifies build output and dry-run only; no live Worker deployment was performed.
- [x] Deployed and health-checked the dedicated staging Worker `ministaff-ai-dashboard-staging`. Latest Worker build/deploy/public Supabase binding sync/health-check passed on [run 38884117058](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884117058); standard CI passed on [run 38884159683](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884159683). The live `/api/health` response is `{"ok":true,"service":"ministaff-ai"}`. Existing Pages project `ministaff-ai` and Worker `ministaff-forms` were preserved. This is staging only, not production.
- [x] Updated Supabase session middleware so public setup/health paths do not instantiate a Supabase client when URL/public-key configuration is missing; protected paths still redirect to login. This is a bootstrap safeguard, not a live authentication test.
- [x] Created a fresh dedicated Supabase project `ministaff-ai` in organization `JARVIS`, region `ap-south-1` (Mumbai), ref `qgxjjvhzggepfurjtpyd`, status `ACTIVE_HEALTHY`. The two older inactive projects were left untouched.
- [x] Applied and verified all four migrations in order: `0001_init`, `0002_ministaff_sales_desk`, `0003_lead_webhooks_and_jobs`, `0004_lead_job_worker`. Migration history confirms all four; inventory confirms 8 public tables, all 8 with RLS enabled, 15 policies, and expected workspace/invitation functions.
- [x] Configured GitHub Actions secret `SUPABASE_SECRET_KEY` under the exact name expected by the workflow and verified the server-only key sync step passed on [Worker run 38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927). A mistakenly named `SUPABASE` secret may remain but is unused. Live authentication/data-path tests remain open.
- [ ] Add `AGENT37_API_KEY` as a **server-side secret** and verify Agent37 wallet status. The key must never be pasted into chat, committed to Git, or exposed in client code.
- [ ] Configure public site URL, auth redirect allow-list, email provider/templates, and verified sender for the selected environment.

## 1. Product and website

## Domain registration for MiniStaff SMTP

- [ ] User requested a domain from DigitalPlat FreeDomain. The official README lists `.dpdns.org`, `.us.kg`, `.qzz.io`, `.xx.kg`, and `.qd.je`; official registration dashboard: https://dash.domain.digitalplat.org/.
- [ ] Proposed first name to check: `ministaff.dpdns.org` (availability and registration are not confirmed).
- [x] Opened the official DigitalPlat dashboard (`https://dash.domain.digitalplat.org/`) on the user's connected Windows PC on 2026-10-16 at the user's explicit request. This only opens the website; no account login, domain search, purchase, or registration was performed.
- [ ] User signs in, reads current notices/policies, and verifies exact name availability, suffix support, nameserver requirements, slots and any displayed price before registration. No domain has been registered yet.
- [ ] Prepare an external DNS zone with Cloudflare only after confirming the proposed name and current registration requirements; enter the exact nameservers provided by Cloudflare. DigitalPlat's guide says normal DNS records are managed at the external authoritative DNS provider.
- [ ] After domain registration/delegation, configure and verify email-related DNS records with the selected SMTP provider; then test Supabase confirmation and password-reset messages.

## Active auth follow-up

- [ ] SMTP setup is now the active workstream. Supabase Auth is healthy, signup is enabled, email confirmation remains required, staging URL/redirects and 8-character minimum are configured; SMTP host/port/credentials/sender are blank. Choose a controlled sender domain or use the default SMTP only for restricted internal testing before attempting real signup emails.


- [x] Add a MiniStaff-branded public homepage with clear product areas and links to sign in and create an account.
- [x] Add signup-mode query handling so homepage account-creation links land on the signup form.
- [ ] Review all dashboard pages for MiniStaff branding; remove leftover starter-kit labels, logos, demos, and copy.
- [ ] Check mobile/tablet/desktop layouts, navigation, empty/loading/error states, keyboard navigation, and contrast.
- [ ] Verify every public and in-app link: sign in, create account, dashboard, lead desk, appointments, usage, settings, privacy, and terms.
- [ ] Review product claims against the features actually enabled in the deployment; label preview/sample data clearly.
- [ ] Add real support/privacy contact details and complete legal review before public launch.
- [x] Add MiniStaff Open Graph/Twitter metadata, a custom SVG app icon, a robots policy, and a branded 404 page.
- [ ] Verify canonical URL and final social preview against the real production hostname once the deployment target is selected.
- [ ] Verify HTTPS, production domain/DNS, redirect behavior, and that the existing marketing/forms site is unchanged.

## 2. Login, signup, email verification & recovery

- [x] Configured Supabase Auth for the fresh project with signup enabled and email auto-confirm disabled, so email confirmation is required; set password minimum to 8 characters to match the app.
- [x] Set the Supabase site URL to `https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev` and the redirect allowlist to staging callback paths plus localhost development paths. Live callback behavior remains untested.
- [ ] Configure and verify a trusted SMTP/email sender; Supabase Auth email templates exist, but SMTP host, port, sender, and credentials are currently unconfigured. Test confirmation and password-reset email delivery.
- [ ] Sign up with a new email; verify the expected check-your-email state and that an unverified user cannot access protected workspace data.
- [ ] Open a valid confirmation link; verify the session is established and the user reaches the intended in-app destination.
- [ ] Test expired, malformed, already-used, and cross-browser confirmation links; show a helpful failure message.
- [ ] Sign in with correct credentials; verify session cookies, refresh, and protected-page access.
- [ ] Confirm wrong password, unknown email, disabled user, unverified email, and rate-limited requests fail safely without leaking account details.
- [ ] Test sign out; confirm protected pages and APIs reject the cleared session.
- [ ] Request a password reset, open the link, set a new password, and verify the old password no longer works.
- [x] Add regression coverage for safe redirect handling; automated test checks internal paths and rejects external, protocol-relative, backslash, and control-character paths.
- [ ] Verify redirects and email confirmation live on the selected production host.
- [ ] Test duplicate signup, email case/whitespace handling, minimum password length, and form validation.
- [ ] Test resend-confirmation behavior (if offered), throttling, and neutral user-facing responses.
- [ ] Verify no auth tokens, service-role keys, Agent37 keys, or provider secrets are rendered into HTML, logs, client bundles, or URLs.

## 3. Workspace accounts, permissions & data isolation

- [ ] Verify new-user onboarding creates exactly one initial workspace, owner membership, and appropriate default settings.
- [ ] Verify invite creation, expiration, single use, invited-email matching, role assignment, acceptance, and revocation.
- [ ] Test owner/admin/member permissions for every page, server action, and API route; missing membership should not reveal a workspace exists.
- [ ] Use two test accounts and two workspaces to prove that leads, appointments, agents, usage, invites, webhooks, and files cannot cross tenant boundaries.
- [ ] Audit privileged service-role database access: every read/write must follow session-derived identity and membership/role checks.
- [ ] Audit Row Level Security, table grants, constraints, indexes, cascade behavior, and migration rollback strategy.
- [ ] Verify request validation, safe error messages, rate limiting, CSRF/origin assumptions, and server-only secret handling.
- [ ] Verify account deletion/data export/retention behavior and document which third-party services process customer data.

## 4. Agent fleet and Agent37 runtime

- [ ] Add the server-side Agent37 key only after the target deployment exists; confirm server routes can reach the API.
- [ ] Verify create, list, detail, start/wake, stop/sleep, restart, update, resize, and delete flows against a **test** instance.
- [ ] Confirm billing/wallet handling, per-agent budgets, and clear 402/error messages before provisioning anything that spends real credits.
- [ ] Test the actual lifecycle/first-response latency over repeated runs and record p50/p95 rather than promising a wake-time target.
- [ ] Test chat, conversation/session history, files, model listing, integrations, messaging connections, and signed port links.
- [ ] Confirm each agent mirrors to the correct workspace row; prevent cross-workspace agent-ID access.
- [ ] Test provider timeout, rate limit, bad key, empty wallet, agent offline, deleted remote instance, and partial failure paths.
- [ ] Add a manual-cost smoke test only with explicit budget awareness; it provisions a real Agent37 instance and is not a normal CI test.

## 5. Leads, website intake & durable processing

- [x] Implemented lead webhook configuration UI, one-time secret display, hashed key storage, and inbound lead ingestion code.
- [x] Added a durable lead-job schema with status, attempts, scheduling, and idempotency fields.
- [x] Applied migrations 0001–0004 to the new dedicated MiniStaff project and verified migration history, 8 public tables, RLS enabled on all 8 tables, 15 policies, and expected functions. Functional webhook/job tests remain open.
- [ ] Test valid webhook request, missing/wrong secret, malformed JSON, oversized body, replay, stable idempotency key, and rate limiting.
- [ ] Test duplicate webhook delivery does not create duplicate leads or duplicate jobs.
- [x] Added the server-side cron worker and atomic claim/lease RPC with bounded attempts, exponential backoff, stale-lock recovery, and operator-visible job results in code.
- [x] Automatic lead triage is opt-in and off by default; the worker stores bounded classification output for human review and does not send messages or book appointments.
- [ ] Configure `MINISTAFF_CRON_SECRET` (or `CRON_SECRET`) and deliberately enable `MINISTAFF_AUTO_TRIAGE_ENABLED=true` only after staging migrations, a test workspace, and Agent37 cost checks pass.
- [ ] Confirm webhook success is returned only after the durable write succeeds; do not depend on a background process that may be terminated with the request.
- [ ] Test lead qualification/status changes, search/filter, notes, contact fields, error recovery, and workspace isolation.
- [ ] Verify the external website form can submit to the live endpoint and that the lead appears in the intended workspace.

## 6. Appointments, follow-ups & handoff

- [ ] Verify appointment create/read/update/cancel, lead association, status transitions, notes, and timezone display.
- [ ] Test collisions/double booking, invalid dates, daylight-saving edge cases, past dates, duplicates, and concurrent updates.
- [ ] Verify reminder/follow-up delivery, retry rules, deduplication, opt-out/suppression, and provider failures before enabling outbound actions.
- [ ] Test human handoff and explicit approval boundaries; outbound messages/bookings must not be silently enabled by a UI toggle.
- [ ] Run a full lead-to-appointment test with a dedicated test workspace and non-real contact details.

## 7. Usage, tokens, quotas, BYOK & cost safety

- [ ] Verify usage values come from the provider or recorded events and are labelled with their source and freshness.
- [ ] Test input/output token counts, tool/model calls, cost units, monthly period boundaries, and empty/error states.
- [ ] Implement an authoritative monthly quota check that is enforced server-side and atomically before work starts; the UI counter alone is not enforcement.
- [ ] Test concurrent jobs near quota limits, retries, cancelled/failed jobs, provider-reported usage, timezone, and month rollover.
- [ ] Verify BYOK secrets are encrypted or stored in a managed secret facility, masked after entry, never retrievable from client APIs, and scoped per tenant/provider.
- [ ] Verify hard spend caps or wallet/budget guards fail closed where reliable metering is unavailable.
- [ ] Confirm no demo usage, tokens, savings, or money figures are represented as real customer data.

## 8. Deployment and runtime operations

- [x] Deploy the MiniStaff app to the dedicated Cloudflare staging Worker and verify its live `/api/health` response. This confirms staging runtime reachability only; production release, Supabase/Auth, and Agent37 integrations remain unverified.
- [x] Added a dedicated Cloudflare Worker build/dry-run workflow and guarded staging publish + health-check steps on `build/ministaff-from-scratch`. The repository secret `CLOUDFLARE_API_TOKEN` is configured, and the staging publish plus health check passed in [Worker run 38881986997](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38881986997).
- [ ] Configure Node 22 build/runtime assumptions, environment variables, cache behavior, and Worker request/runtime limits.
- [x] Added the server-only Supabase secret API key as GitHub Actions secret `SUPABASE_SECRET_KEY`; the Worker workflow synced it successfully on run 38887168927. [ ] Add `AGENT37_API_KEY` as a server-side secret after auth/data checks and budget awareness; configure the cron secret only when queue tests are ready.
- [ ] Ensure secret names/values are not committed, printed in logs, or included in client-prefixed variables unless explicitly public.
- [x] Apply reviewed, versioned database migrations to the dedicated Supabase staging project; verified all four migration records and table/RLS inventory. Live auth and data-path smoke tests are still required before serving traffic.
- [ ] Deploy to a preview URL; verify health response, login, callback links, data writes, Agent37 connectivity, error monitoring, and rollback path.
- [ ] Verify domain/DNS/HTTPS and Supabase redirect allow-list only after the correct production hostname is known.
- [ ] Add structured server logs, actionable error reporting, request IDs, queue backlog/failure monitoring, and cost alerts.
- [ ] Verify backup/restore, incident steps, key rotation, webhook-secret rotation, and database migration rollback.
- [ ] Run a production smoke test with a dedicated test account; do not use real customer contacts or send real messages.
- [ ] Confirm a rollback/deployment recovery path before launch.

## 9. Automated verification & release gate

- [x] Existing CI workflow runs dependency installation, TypeScript typecheck, and Next.js production build.
- [x] Verified latest ordinary CI on [run 38886945020](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38886945020) and the latest staging Worker build/deploy/public settings + server-only key sync + health check on [run 38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927). All deployment steps passed.
- [ ] Add automated tests for redirect safety, auth callback paths, webhook auth/idempotency, permission checks, quota enforcement, and queue retry transitions.
- [ ] Run `npm ci`, `npm run typecheck`, `npm run build`, and non-billable smoke tests on the final candidate commit.
- [ ] Run browser E2E against the preview deployment for signup → email confirmation → login → create workspace → create lead → enqueue/process job → appointment → usage.
- [ ] Perform negative/unauthorized tests, mobile/accessibility pass, dependency/security scan, and secrets scan.
- [ ] Record commit SHA, successful CI run, deployment URL, database migration version, and test results here.
- [ ] Keep release blocked until the critical auth, tenant isolation, secret handling, queue reliability, and deployment checks pass.

## 10. Manual verification record

Fill these fields in only after observing the actual deployment:

- **Staging URL:** https://ministaff-ai-dashboard-staging.itsmeadityabro.workers.dev — live `/api/health` verified by [Worker run 38884117058](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884117058)
- **Production URL:** _not identified_
- **Deployment provider/project:** Cloudflare Workers; `ministaff-ai-dashboard-staging` is deployed and health-checked. Supabase public settings and server-only key are synced on [run 38887168927](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38887168927). Production hostname remains unidentified; this is not a production release.
- **Cloudflare compatibility/build:** 100% compatibility scan. Worker build, staging publish, Supabase public-binding sync, and health check passed on [run 38884117058](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884117058); ordinary CI passed on [run 38884159683](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38884159683).
- **Supabase project ref/status:** `qgxjjvhzggepfurjtpyd` (`ministaff-ai`), ACTIVE_HEALTHY, region `ap-south-1`; migrations 0001–0004 applied and verified. Auth site URL/allowlist configured; the server-only key is synced to staging; SMTP is pending.
- **Agent37 create/chat/delete smoke run:** _not run; requires server key and budget approval_
- **Last verified full CI run:** [run 38892741258](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38892741258) — success on current branch head `be5beae1363ed9c55598e432ee9eae004870d975`.
- **Checklist refresh commit / CI:** this document records the fresh Supabase project, four applied migrations, and latest staging/CI evidence above. Authentication and tenant-isolation tests, Agent37 connectivity, server-only secret configuration, and production release remain open.
- **Verified by / date:** _pending_



## 11. DigitalPlat domain registration checkpoint (2026-10-16)
- [x] User replied "approved complete setup" after the guardian-consent checkpoint; DigitalPlat account name shown is "Sudeep Sahu" and user previously confirmed it is the intended account.
- [x] Live DigitalPlat availability check confirmed `ministaff.dpdns.org` is available for the free slot (account UI showed 1 free slot, 0 paid slots, 0 plan slots).
- [x] Selected `.dpdns.org`, selected the free domain slot, and selected External nameservers. No paid slot/bundle/subscription used.
- [x] Created Cloudflare zone `ministaff.dpdns.org` under the same account that contains the MiniStaff staging Worker; plan is Free Website, zone ID `7bed7a8696b9b569b086bcdcc3058c01`, status `pending`. Exact assigned nameservers: `patryk.ns.cloudflare.com`, `peaches.ns.cloudflare.com`.
- [x] Entered both exact Cloudflare nameservers in the DigitalPlat form.
- [ ] Complete DigitalPlat's official account reauthentication. The free slot flow requires GitHub OAuth verification; clicking "Verify with GitHub" returned `reauthentication_required` and "Verify your identity to change security settings." User must complete this through the official UI; do not bypass reauthentication or ask for/share passwords or codes.
- [x] Reopened the DigitalPlat verification page at `https://dash.domain.digitalplat.org/user/kyc` with GitHub OAuth selected and the button visible for the user. Known failure is from DigitalPlat before reaching GitHub; recommended safe recovery is sign out/in to DigitalPlat, retry, and contact `contact@digitalplat.org` if still blocked.
- [ ] After verification succeeds, finish registration using the selected free slot and exact Cloudflare nameservers. Then verify exact domain appears in DigitalPlat Domain List and confirm Cloudflare zone status becomes active.
- [ ] Configure records/Worker custom hostname and email-sending DNS only after active delegation is verified. The root hostname is not yet connected to the staging Worker, SMTP isn't configured, and this is not a production release.
- [x] No domain registration was submitted and no payment was made. Existing Workers and Pages were not modified.



## 12. Alternate .IN domain purchase option (2026-10-16)
- [ ] Compare `ministaff.in` and `ministaffai.in` live availability at the registrar. Preference is `ministaff.in` if available, with acceptable renewal pricing.
- [ ] Before checkout, check the full registration term, renewal cost, taxes/fees, and auto-renewal. Official .IN registry publishes ₹500/domain-year wholesale pricing and says retail registrars set their own prices: https://www.registry.in/tariff. ₹99 may be promotional.
- [ ] Parent/legal guardian oversees the purchase and confirms accurate registrant/contract details.
- [ ] After purchase, confirm ownership in the registrar dashboard and create a separate Cloudflare zone for the purchased domain. Set the registrar's nameservers to the exact Cloudflare-assigned values, then connect only the staging hostname to the staging Worker.
- [ ] Do not claim a domain is purchased until checkout completes and the registrar lists it. DigitalPlat `ministaff.dpdns.org` remains unregistered; its pending Cloudflare zone is separate and untouched.


## 13. Progress snapshot — 2026-10-16
- **Estimated engineering foundation/infrastructure: 65–70% complete.** Main application scaffolding and major feature foundations exist; CI is green; dedicated Cloudflare staging Worker is deployed/health-checked; Supabase is healthy with 4 migrations applied, all 8 public tables RLS-enabled; server-only Supabase key sync passed.
- **Estimated launch readiness: 30–35%.** A checklist count is not an exact product-completeness metric: 38 of 123 individual checkboxes were checked before this snapshot. Many launch-blocking live tests remain open.
- Domain purchase is deferred by the user. Use the existing `workers.dev` staging URL for development. Do not treat `ministaff.dpdns.org` as registered or live; its Cloudflare zone is pending and separate from a future purchased .IN domain.
- Next work: auth/email delivery end-to-end; two-account/two-workspace permission and isolation tests; Agent37 server-side secret and budget-aware smoke test; webhook/idempotency/queue and appointment tests; authoritative server-side quota/cost protections; then responsive/accessibility, monitoring/backups, legal/support, production DNS/deploy, and rollback testing.
