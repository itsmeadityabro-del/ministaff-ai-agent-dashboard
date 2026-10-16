# MiniStaff AI — End-to-End Checklist

Last reviewed: 2026-10-16 (Asia/Kolkata). This is the canonical dashboard/workflow checklist. Update the status and evidence here before repeating a test.

**Status definitions:** `PASS` = executed successfully with evidence; `CODED` = implementation exists but runtime is unproven; `BLOCKED` = requires credentials, external setup, or approved live test; `TODO` = not implemented or not verified.

## Verified evidence on the GitHub branch

- [x] GitHub Actions passed `npm ci`, `npm test` (14 tests), `npm run typecheck`, and `npm run build` after applying and synchronizing semver-compatible dependency updates. The resulting branch head is `bdee59f6f2eedc727d25c24b8952ddd71074fae0`. [Workflow run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38937092828).
- [x] Non-billable Node unit/contract tests passed in the same CI run, including a regression check that the customer API cannot create/delete a subscription-managed Agent37 instance, delete its workspace, expand workspaces/teams, or raise budget/compute beyond plan controls.
- [x] Source and Cloudflare metadata reviewed on 2026-10-16.
- [ ] **SECURITY FOLLOW-UP — npm audit:** remaining 3 low advisories in `streamdown`, `mermaid`, and `katex`; no high/critical advisories in the audited dashboard dependency tree. Review markdown/diagram input exposure and update the dependency chain before production.
- [ ] Cloudflare staging build matches the reviewed GitHub commit; no deployment has been verified from this branch.
- [ ] Supabase staging migrations and customer end-to-end tests.

## Dashboard and configuration

- [ ] **CODED — Supabase secret alias:** server-only client accepts `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY`. Deploy and verify against staging.
- [ ] **CODED — White-label branding:** MiniStaff name/logo changed in source. Verify responsive browser preview.
- [ ] **CODED — Lead management:** workspace-scoped create/list/search/edit/status-update/delete UI and APIs. Manual entry only; public inbound capture and CRM/prospecting integrations remain TODO below.
- [ ] **CODED — Appointment management:** workspace-scoped create/list/edit/status/delete, lead reassignment scoped to the workspace, ISO timestamp validation, IANA timezone validation, and overlap rejection backed by a database exclusion constraint.
- [ ] **CODED — Usage overview:** Agent37 managed budget, reported LLM input/output tokens, call count and live agent status. Confirm real provider response shape.
- [ ] **CODED — Regression suite:** non-billable Node tests for time/email rules and static tenant/security contracts; not authenticated API integration tests.

## Database and authentication

- [ ] **BLOCKED — Apply migrations:** apply `0002_ministaff_customer_access.sql`, `0003_ministaff_workflows.sql`, and `0004_ministaff_api_only_access.sql` to the intended Supabase staging project. Local/GitHub SQL files do not imply remote application.
- [ ] **TODO — Customer bootstrap:** test confirmed purchase email, active entitlement, account linking, bootstrap RPC, first workspace and agent mirror.
- [ ] **TODO — Negative auth cases:** no session, unconfirmed email, inactive/review entitlement, account linked to another user, invalid route IDs.
- [ ] **TODO — Tenant isolation:** two separate test accounts; prove neither can read/update/delete another customer's leads, appointments, agent or usage.
- [ ] **TODO — DB role check:** confirm migration 0004 removes browser-role table and RPC access and all service-role calls are only behind authenticated, account/workspace-scoped route handlers.

## Agent lifecycle and integrations

- [ ] **BLOCKED — Authorized Agent37 smoke:** verify a dedicated staging instance's health/chat/lifecycle. Provision and deprovision test instances only through the approved support/Worker lifecycle, not customer delete routes; requires an explicitly approved small spend budget and funded wallet.
- [ ] **TODO — Chat/files:** real chat/streaming/history and file list/read/write/archive.
- [ ] **TODO — Lifecycle:** status refresh, start/stop/restart and safe failure behavior; avoid deleting the customer's provisioned staffer.
- [ ] **TODO — Integrations:** validate one Composio connection and one Telegram/WhatsApp channel with test credentials.

## Lead and appointment acceptance

- [ ] **CODED — Lead lifecycle:** create, search, edit fields, update all statuses, delete, reload and verify persistence in Supabase staging.
- [ ] **CODED — Appointment lifecycle:** create, edit title/lead/time/notes/status, complete/cancel, delete, reload and verify timezone display in Supabase staging.
- [ ] **CODED — Booking collision:** application check plus database exclusion constraint return HTTP 409 for overlaps; staging checks for concurrent and back-to-back cases remain required.
- [ ] **TODO — Calendar integration:** not provided by appointment CRUD alone. Configure Google/Outlook or another calendar before claiming synced availability or sending invites.
- [ ] **TODO — Lead discovery/inbound capture:** manual lead entry exists; public form/webhook capture, CRM sync and external prospect discovery remain unverified.

## Usage, plan limits, billing

- [ ] **CODED — Usage accuracy:** dashboard maps Agent37 spend, input/output tokens, and call counts; compare displayed values against the live provider for the same period.
- [ ] **CODED — Plan enforcement:** activation Worker assigns provider-side plan budgets; dashboard budget writes are capped at $0/$10/$25 per Plus/Pro/Max tier (Plus retains its separate one-time $1 starter credit) and customer resizing is disabled. Verify actual provider caps, plan mapping, and entitlement changes in staging; a dashboard meter alone does not enforce spending limits.
- [ ] **TODO — BYOK accounting:** confirm external subscription/API use is not falsely represented as Agent37 managed spend.
- [ ] **BLOCKED — Gumroad flow:** Plus/Pro/Max checkout, valid/invalid/refunded/cancelled license, activation, idempotency, provisioning and cancellation with an approved test purchase. Worker-specific steps are tracked in the [website/Worker release checklist](https://github.com/itsmeadityabro-del/ministaff-ai-website/blob/codex/ministaff-e2e-checklists/docs/WORKER_RELEASE_CHECKLIST.md).

## Release gate

- [x] GitHub Actions passed `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` on commit `2a7a7f1c3c9d41b1c74c38cbb7acdbf959cd477e`. [Workflow run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38932462090).
- [ ] Browser-test desktop/mobile layout, authentication, nav, loading/empty/error states.
- [ ] Apply both migrations to staging using an approved deployment path and verify migration records.
- [ ] Link Gumroad/activation Worker to the portal account table; requires portal Supabase URL and server-only key binding on the forms Worker.
- [ ] Deploy the same approved source revision to Cloudflare staging and record its deployment ID.
- [ ] Verify support inbox, contact form, legal pages and analytics configuration.
- [ ] Record commit SHA, staging deployment ID and dated evidence before promoting to production.

## Anti-duplication rules

1. Read this file before starting or repeating an E2E task.
2. A code review or local build is not a live integration test.
3. Change a status to `PASS` only with dated test evidence in the same pull request.
4. Never repeat billable Agent37, Gumroad purchase/refund, or production-migration steps without an explicit budget/environment decision.
5. Website/forms tests live in the [website release checklist](https://github.com/itsmeadityabro-del/ministaff-ai-website/blob/codex/ministaff-e2e-checklists/docs/RELEASE_CHECKLIST.md); link there rather than duplicating steps.
