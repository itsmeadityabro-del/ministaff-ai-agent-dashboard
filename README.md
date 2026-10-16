# MiniStaff AI

MiniStaff AI is a customer-facing workspace for running AI agents alongside lead intake, appointments, usage visibility, and team access.

This repository contains the Next.js app, Supabase Auth/data access, Agent37 server-side integration, and sales-desk features. This rebuild is being done on `build/ministaff-from-scratch`; existing branches are preserved. Read `docs/BUILD_AND_LAUNCH_CHECKLIST.md` before treating any environment as ready to launch.

## Product areas

- **Agent fleet:** provision and manage Agent37 instances from a workspace.
- **Agent workspace:** agent chat, files, integrations, messaging, and settings supported by the Agent37 API.
- **Sales desk:** leads, pipeline status, website intake webhook, and job history.
- **Appointments:** booking and appointment management screens.
- **Usage:** provider-reported spend and model/token summaries where available.
- **Team & settings:** workspaces, membership, invitations, and configuration.

Feature code in the repository is not proof that the live provider connection, worker, database migration, email delivery, or deployment is operational. See the checklist for verification state.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth and Postgres
- Agent37 Cloud API for agent instances
- GitHub Actions for typecheck and production-build validation

## Local development

Requirements: Node.js 20+ and npm.

1. Install dependencies: `npm ci`
2. Copy `.env.example` to `.env.local`.
3. Fill in the local environment values using your provider dashboards; never paste keys into chat or commit them.
4. Start the app: `npm run dev`
5. Run static type checks: `npm run typecheck`
6. Run the production build: `npm run build`

The repository's `npm run setup` script can help configure a Supabase project, but it requires a valid Supabase access token and Agent37 credential as documented in `SETUP.md`. Do not use an inactive or production database until its ownership and data have been verified.

### Environment values

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase public/anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only database privilege key; never use a `NEXT_PUBLIC_` prefix.
- `AGENT37_API_KEY`: server-only Agent37 credential.
- `NEXT_PUBLIC_SITE_URL`: deployed application origin used for auth redirects (set for each environment).
- Any worker/cron token and provider-specific keys required by enabled features.

Use the platform's secret/environment-variable manager in staging and production. Keep credentials out of logs, screenshots, commits, and browser bundles.

## Verification

- `npm ci`
- `npm run typecheck`
- `npm run build`
- `npm run smoke` is an opt-in, real-provider smoke test which can provision a billable Agent37 instance. Run it only with an explicit test budget and a dedicated test environment; it is not a default CI step.
- Use `docs/BUILD_AND_LAUNCH_CHECKLIST.md` to test sign-up, email confirmation, password recovery, tenant isolation, lead intake, queue processing, appointments, usage/quota limits, and deployed-site behavior.

## Deployment safety

- Deploy this branch only to a dedicated staging project first.
- Preserve the unrelated Cloudflare Worker `ministaff-forms`; do not overwrite it.
- The deployment host and an active Supabase project must be identified before calling the app deployed.
- Email confirmation, callback URLs, email sender settings, secret values, database migrations, and provider credentials must be configured in the selected environment.
- Do not enable outbound messages or live booking actions until approval, idempotency, retry, and test-contact checks pass.

## Project documents

- `docs/ARCHITECTURE.md` — component boundaries and security invariants.
- `docs/BUILD_AND_LAUNCH_CHECKLIST.md` — implementation, login, website, deployment, and verification gates.
- `SETUP.md` — existing first-time provider setup procedure.
