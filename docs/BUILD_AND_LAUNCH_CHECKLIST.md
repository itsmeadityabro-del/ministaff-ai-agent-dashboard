# MiniStaff AI — Build, Login, Website & Release Checklist

**Branch:** `build/ministaff-from-scratch`  
**Rule:** A box is checked only when the named verification has actually passed. Code existing in the repository is not proof that a live integration or production deployment works.

## Current evidence and blockers

- [x] Created an isolated rebuild branch; the existing sales-desk branch and default branch remain untouched.
- [x] Installed the locked dependencies in a cloud coding workspace with `npm ci`.
- [x] Inspected the repository and kept the pre-existing sales-desk/default branches untouched.
- [x] The rebuild branch passes `npm ci`, TypeScript `npm run typecheck`, `npm run test:security`, and the Next.js production build on GitHub Actions for commit `a931f71fcc23cb0ba14079c12966971c02f66ee6` ([CI run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38864758983)).
- [x] Added a branded marketing site, signup entry links, metadata/app icon, robots policy, branded 404, `/api/health`, redirect regression tests, and guarded lead triage queue worker code.
- [ ] Review all dependency audit findings. CI reported 10 npm audit findings (1 critical, 4 high, 4 moderate, 1 low); fix and retest without blindly applying breaking dependency upgrades.
- [ ] Identify and verify the deployed full-stack MiniStaff URL. An existing Cloudflare Pages project was located, but its current `dist` output configuration is not evidence that Next.js server routes work there.
- [ ] Choose an active Supabase environment. The connected account returned two projects with status `INACTIVE`; neither has been modified.
- [ ] Restore/select the correct Supabase project and verify schema/migration state before applying migrations.
- [ ] Re-authorize Vercel using the connection link in the handoff; existing Vercel credentials returned HTTP 403 `invalidToken`.
- [ ] Configure a dedicated deployment target. Do **not** deploy to or overwrite the existing Cloudflare Worker `ministaff-forms`.
- [ ] Add `AGENT37_API_KEY` as a **server-side secret** and verify Agent37 wallet status. The key must never be pasted into chat, committed to Git, or exposed in client code.
- [ ] Configure public site URL, auth redirect allow-list, email provider/templates, and verified sender for the selected environment.

## 1. Product and website

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

- [ ] Configure Supabase Auth with email verification required for newly created accounts in the chosen environment.
- [ ] Configure the exact deployed callback URL `/auth/callback`, site URL, localhost development URL, and allowed redirects.
- [ ] Set up email delivery, sender identity, confirmation template, password-reset template, and rate limits.
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
- [ ] Apply the migrations to the chosen active Supabase project and verify each table/index/policy afterward.
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

- [ ] Select the actual host and connect the GitHub repository to a dedicated staging project.
- [ ] Configure production build command, Node/runtime compatibility, region, environment variables, build cache, and server function limits.
- [ ] Add all required values as platform secrets: Supabase URL/public key/service role, Agent37 key, cron/worker token, site URL, and any enabled provider keys.
- [ ] Ensure secret names/values are not committed, printed in logs, or included in client-prefixed variables unless explicitly public.
- [ ] Apply reviewed, versioned database migrations to staging before serving traffic.
- [ ] Deploy to a preview URL; verify health response, login, callback links, data writes, Agent37 connectivity, error monitoring, and rollback path.
- [ ] Verify domain/DNS/HTTPS and Supabase redirect allow-list only after the correct production hostname is known.
- [ ] Add structured server logs, actionable error reporting, request IDs, queue backlog/failure monitoring, and cost alerts.
- [ ] Verify backup/restore, incident steps, key rotation, webhook-secret rotation, and database migration rollback.
- [ ] Run a production smoke test with a dedicated test account; do not use real customer contacts or send real messages.
- [ ] Confirm a rollback/deployment recovery path before launch.

## 9. Automated verification & release gate

- [x] Existing CI workflow runs dependency installation, TypeScript typecheck, and Next.js production build.
- [ ] Ensure this rebuild branch runs the same workflow on push.
- [ ] Add automated tests for redirect safety, auth callback paths, webhook auth/idempotency, permission checks, quota enforcement, and queue retry transitions.
- [ ] Run `npm ci`, `npm run typecheck`, `npm run build`, and non-billable smoke tests on the final candidate commit.
- [ ] Run browser E2E against the preview deployment for signup → email confirmation → login → create workspace → create lead → enqueue/process job → appointment → usage.
- [ ] Perform negative/unauthorized tests, mobile/accessibility pass, dependency/security scan, and secrets scan.
- [ ] Record commit SHA, successful CI run, deployment URL, database migration version, and test results here.
- [ ] Keep release blocked until the critical auth, tenant isolation, secret handling, queue reliability, and deployment checks pass.

## 10. Manual verification record

Fill these fields in only after observing the actual deployment:

- **Preview URL:** _not verified_
- **Production URL:** _not identified_
- **Deployment provider/project:** _not verified_
- **Supabase project ref/status:** _not selected; discovered projects were inactive_
- **Agent37 create/chat/delete smoke run:** _not run; requires server key and budget approval_
- **Last verified CI run:** [run 38864758983](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38864758983) — success for commit `a931f71fcc23cb0ba14079c12966971c02f66ee6` before this checklist refresh.
- **Checklist refresh commit / CI:** pending until the doc-only change is validated.
- **Verified by / date:** _pending_

