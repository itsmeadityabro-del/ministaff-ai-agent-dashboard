# MiniStaff AI — Architecture and Build Notes

## Product boundary

MiniStaff is the customer-facing workspace and operating layer. Agent37 hosts the per-customer agent sandboxes. Supabase is the intended system of record for user identity, workspace membership, leads, appointments, configuration, and job history. A provider connector is not a substitute for application authorization or data isolation.

## Current application shape

- **Web app:** Next.js App Router, TypeScript, React, Tailwind CSS.
- **Identity:** Supabase Auth via the SSR client and cookie-based sessions. Email confirmation depends on the selected Supabase project's Auth settings and allowed URLs.
- **Authorization:** server helpers in `src/lib/auth.ts` derive the signed-in identity from the verified session and check workspace membership/role before using the privileged service-role client. Because the service-role client bypasses RLS, those membership checks are security-critical.
- **Agent plane:** `src/lib/agent37.ts` is a server-only wrapper for Agent37's control/data plane. The `AGENT37_API_KEY` must remain server-only.
- **Sales desk:** lead CRUD, inbound webhook credentials, lead intake, queue history, appointment screens, and usage views exist in the codebase; actual production connectivity and the complete job-execution worker still need verification.
- **CI:** GitHub Actions runs dependency installation, TypeScript type checking, and Next.js production build.

## Target request flow

1. Browser session → Supabase Auth verifies the user.
2. Route handler/server component → resolves user identity from that session, never from a request-supplied user ID.
3. Workspace membership/role gate → checks every resource access before privileged database calls.
4. Durable database write → validates and persists user actions and inbound lead/job records.
5. Worker/queue runner → claims eligible jobs with a lease, executes with idempotency, retries transient failures, and records final status.
6. Agent37 → isolated agent runtime under a per-customer association and budget.
7. Usage ledger/summary → reconciles provider data, token use, and enforceable per-tenant quotas.
8. Monitoring → tracks failed jobs, auth errors, provider errors, latency, and spend.

## Security invariants

- Never accept a workspace ID, agent ID, role, or user ID as proof of access; verify the relationship server-side.
- Never expose service-role keys, Agent37 credentials, cron tokens, BYOK credentials, or webhook secrets to the client or repository.
- Store only a hash of long-lived inbound webhook secrets; show a newly issued secret once and support rotation/revocation.
- Validate payload size, shape, email/phone formats where used, enum values, timestamps, and idempotency keys.
- Every external action must have an explicit policy for approval, cancellation, timeout, retry, and duplicate delivery.
- UI usage counters are informational only; quota enforcement must happen server-side with concurrency-safe reservation/check logic.
- Treat provider responses, imported lead text, agent output, and webhooks as untrusted data, never as executable instructions.
- Preserve unrelated infrastructure: the existing `ministaff-forms` Cloudflare Worker is out of scope for dashboard deployment.

## Deployment readiness

The connected Vercel account currently fails authentication with a 403 invalid-token response. The connected Supabase account listed two projects as inactive. Until a target host and active database are selected, no production deployment or live login/webhook test can honestly be marked successful. The build checklist records these gates and should be updated only with direct evidence.
