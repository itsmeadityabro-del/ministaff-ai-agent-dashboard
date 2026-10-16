# MiniStaff AI — End-to-End Checklist

Last reviewed: 2026-10-16 (Asia/Kolkata). This is the canonical dashboard/workflow checklist. Update the status and evidence here before repeating a test.

**Status definitions:** `PASS` = executed successfully with evidence; `CODED` = implementation exists but runtime is unproven; `BLOCKED` = requires credentials, external setup, or approved live test; `TODO` = not implemented or not verified.

## Verified evidence at branch preparation

- [x] Prior local test evidence: dashboard TypeScript and Next.js production build passed before the latest portal branch work (local checkout is not proof of this GitHub branch).
- [x] Eight non-billable unit/contract tests were run in the local working copy; rerun from this branch's CI before calling them passed remotely.
- [x] Source/Cloudflare metadata reviewed on 2026-10-16.
- [ ] GitHub Actions CI pass on this exact branch/commit.
- [ ] Cloudflare staging build matches the reviewed GitHub commit.

## Dashboard and configuration

- [ ] **CODED — Supabase secret alias:** server-only client accepts `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY`. Deploy and verify against staging.
- [ ] **CODED — White-label branding:** MiniStaff name/logo changed in source. Verify responsive browser preview.
- [ ] **CODED — Lead management:** workspace-scoped create/list/status update/delete APIs and basic dashboard.
- [ ] **CODED — Appointment management:** workspace-scoped create/list/update/status/delete, ISO timestamp validation, IANA timezone validation, and overlap rejection backed by a database exclusion constraint.
- [ ] **CODED — Usage overview:** Agent37 managed budget, reported LLM input/output tokens, call count and live agent status. Confirm real provider response shape.
- [ ] **CODED — Regression suite:** non-billable Node tests for time/email rules and static tenant/security contracts; not authenticated API integration tests.

## Database and authentication

- [ ] **BLOCKED — Apply migrations:** apply `0002_ministaff_customer_access.sql` and `0003_ministaff_workflows.sql` to the intended Supabase staging project. Local/GitHub SQL files do not imply remote application.
- [ ] **TODO — Customer bootstrap:** test confirmed purchase email, active entitlement, account linking, bootstrap RPC, first workspace and agent mirror.
- [ ] **TODO — Negative auth cases:** no session, unconfirmed email, inactive/review entitlement, account linked to another user, invalid route IDs.
- [ ] **TODO — Tenant isolation:** two separate test accounts; prove neither can read/update/delete another customer's leads, appointments, agent or usage.
- [ ] **TODO — DB role check:** confirm browser roles cannot read/write customer tables and server service-role calls are only behind authenticated, workspace-scoped route handlers.

## Agent lifecycle and integrations

- [ ] **BLOCKED — Authorized Agent37 smoke:** create a test instance, wait for health, send one chat, delete it and confirm cleanup. Needs an explicitly approved small spend budget and funded wallet.
- [ ] **TODO — Chat/files:** real chat/streaming/history and file list/read/write/archive.
- [ ] **TODO — Lifecycle:** status refresh, start/stop/restart and safe failure behavior; avoid deleting the customer's provisioned staffer.
- [ ] **TODO — Integrations:** validate one Composio connection and one Telegram/WhatsApp channel with test credentials.

## Lead and appointment acceptance

- [ ] **TODO — Lead lifecycle:** create, search, edit fields, update all statuses, delete, reload and verify persistence.
- [ ] **TODO — Appointment lifecycle:** create, update, complete/cancel, delete, reload and verify timezone display.
- [ ] **TODO — Booking collision:** overlapping scheduled appointments rejected by database constraint (HTTP 409); back-to-back appointments allowed; concurrent test against staging.
- [ ] **TODO — Calendar integration:** not provided by appointment CRUD alone. Configure Google/Outlook or another calendar before claiming synced availability or sending invites.
- [ ] **TODO — Lead discovery/inbound capture:** manual lead entry exists; public form/webhook capture, CRM sync and external prospect discovery remain unverified.

## Usage, plan limits, billing

- [ ] **TODO — Usage accuracy:** compare dashboard spend/token counts with Agent37's reported values for the same period.
- [ ] **TODO — Plan enforcement:** verify provider-side managed-spend caps and plan entitlement. A dashboard meter alone does not enforce spending limits.
- [ ] **TODO — BYOK accounting:** confirm external subscription/API use is not falsely represented as Agent37 managed spend.
- [ ] **BLOCKED — Gumroad flow:** Plus/Pro/Max checkout, valid/invalid/refunded/cancelled license, activation, idempotency, provisioning and cancellation with an approved test purchase.

## Release gate

- [ ] Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` in GitHub Actions on the exact branch commit.
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
