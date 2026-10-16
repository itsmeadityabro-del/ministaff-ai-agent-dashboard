# Setup

This app runs on two secrets you supply (both behind a login, so a human must fetch them):

- **`AGENT37_API_KEY`** (`sk_live_…`) — Agent37 dashboard → **Cloud → API keys**. Then
  **fund the wallet** (Cloud → Billing): creating an agent costs real money, and an empty
  wallet returns a `402` at create time.
- **`SUPABASE_ACCESS_TOKEN`** (`sbp_…`) — [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) (~30s).

`npm run setup` does everything else: creates a free Supabase project (or configures the one
whose URL you paste into `NEXT_PUBLIC_SUPABASE_URL`), runs the migration, enables email/password auth with email confirmation required,
and writes the Supabase URL, anon key, and **server-only service-role key** back into
`.env.local`. (Clients never touch the DB directly — the app reads/writes every table server-side
with the service-role key; see [`AGENTS.md`](AGENTS.md).) It's idempotent and fills only blank
values. Per-variable docs live in [`.env.example`](.env.example).


## OAuth and SMS provider setup

The login screen supports Google OAuth, GitHub OAuth, email one-time codes, and phone SMS OTP. These methods require provider setup in Supabase before they can work:

1. In **Authentication → Providers**, enable **Google** and/or **GitHub** and enter the OAuth client ID/secret from the respective provider console.
2. Copy the Supabase project's callback URL shown by Supabase (usually `https://<project-ref>.supabase.co/auth/v1/callback`) into each OAuth provider's allowed redirect/callback URLs.
3. In **Authentication → URL Configuration**, set the Site URL to the deployed MiniStaff origin and allow `/auth/callback` plus local development callback URLs.
4. Keep **email confirmations enabled** for email/password signups. The setup script configures `mailer_autoconfirm=false`; re-run `npm run setup` to apply that setting to an existing project. For reliable delivery, configure custom SMTP under **Authentication → SMTP Settings**. For six-digit email OTP sign-in, open **Authentication → Email Templates** and configure the **Magic Link** template to visibly include the code variable `{{ .Token }}`. The email must clearly tell users to enter the one-time code in MiniStaff. A template that only renders a clickable link will not give users the code needed by the new code-entry screen. Test confirmation and password-reset templates separately; Supabase's default sender is rate-limited and suitable only for limited testing.
5. For SMS OTP, enable the Phone provider and configure a supported SMS provider (for example Twilio) under Supabase Auth settings. Configure provider credentials and delivery limits in the Supabase dashboard; do not put SMS credentials in browser env variables.

**Important:** Email OTP uses Supabase `signInWithOtp` / `verifyOtp` and requires an email template that displays `{{ .Token }}`; this is distinct from the email confirmation-link flow used by password signups. SMS OTP currently signs a user in with a phone-based identity. It does not add/verify a phone number on an existing email account. Linking and verifying both email and phone on one account is a separate workflow and should be added before requiring both factors for every customer. OAuth provider configuration, email deliverability/SMTP, and real SMS delivery must be tested in staging.

## For your coding agent

The README tells adopters to paste a one-liner that points here. If you're that agent, follow
these steps in order; don't skip the checks.

1. **Scaffold.** Run `npm install`, then `npm run setup` once. On a fresh clone this creates
   `.env.local` from `.env.example` and exits asking for two secrets — that exit is
   **expected**, not an error.
2. **Ask me for the two secrets.** You can't fetch them (both are behind a login). Print where
   to get each, then stop and wait for my reply:
   - `AGENT37_API_KEY` (starts with `sk_live_`): Agent37 dashboard → Cloud → API keys
     (<https://www.agent37.com/dashboard/cloud/api-keys>). Creating agents also needs a
     **funded** wallet (Cloud → Billing), or it later fails with a `402`.
   - `SUPABASE_ACCESS_TOKEN` (starts with `sbp_`): <https://supabase.com/dashboard/account/tokens>.
3. **Validate.** Confirm the prefixes (`sk_live_`, `sbp_`). If one's wrong, ask again — don't proceed.
4. **Write the secrets into `.env.local` only** (confirm it's gitignored first). Fill only
   those two lines; leave everything else as-is. Never print the full `sk_live_` value back
   (mask as `sk_live_…last4`), never `cat .env.local`, never `git add`/commit it.
5. **Complete setup.** Run `npm run setup` again. If it fails, read its message and act on it
   instead of retrying blind:
   - "free-project limit" → ask me for an existing project's URL in `NEXT_PUBLIC_SUPABASE_URL`
     (or free a slot at supabase.com/dashboard), then re-run.
   - "more than one organization" / `403` on create → my account has multiple Supabase orgs (or
     can't create in the default one). Setup prints the orgs with a `SUPABASE_ORG=<slug>` for each;
     re-run as `SUPABASE_ORG=<slug> npm run setup` for the one I want (usually my personal org).
   - `401` → my Supabase token is wrong/expired; ask for a new one.
   - `404` → `NEXT_PUBLIC_SUPABASE_URL` points at a project this token can't see.
6. **Verify.** Run `npm run typecheck` and `npm run build` (no test suite — these two are the gate).
7. **Start.** Run `npm run dev` and report the URL (<http://localhost:3000>): I sign up with
   email + password (open signup with email confirmation required) → land in a fresh workspace. Remind me
   that creating an agent needs a funded wallet — a `402` at create time is the wallet, not a bug.

Constraints: keep changes minimal; add no features; the `sk_live_` key stays server-side;
branding stays code-side (`src/config/branding.ts`).

## By hand

```bash
npm install
npm run setup     # first run creates .env.local and prints the two keys to paste
#                 → paste both into .env.local, then:
npm run setup     # creates/configures Supabase, runs the migration, sets up auth
npm run dev       # http://localhost:3000 → sign up with email + password
```

<details>
<summary><b>Manual Supabase setup</b> — if you'd rather not use an access token</summary>

Leave `SUPABASE_ACCESS_TOKEN` blank, skip `npm run setup`, create a free
[Supabase](https://supabase.com) project, then: (1) **SQL Editor** → run
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (it sets up the schema
*and* revokes direct client table access — all DB access is server-side);
(2) **Authentication → Providers** → enable **Email** and keep email confirmations enabled; (3) **Authentication → URL
Configuration** → Site URL `http://localhost:3000`, add `http://localhost:3000/auth/callback`
to Redirect URLs. Paste the project URL, anon key, and **service-role key** (Project Settings →
API) into `.env.local` (`SUPABASE_SERVICE_ROLE_KEY` — server-only), then `npm run dev`.
</details>

## Deploy to production (Vercel)

The Vercel button alone is **not** enough — it deploys the app but can't create your Supabase
backend or register your sign-in URLs. Run setup locally once first, then:

1. Run `npm run setup` locally (creates Supabase + schema + auth config).
2. Push your fork to GitHub, then in Vercel: **Add New → Project → Import Git Repository**.
3. Add **only these** env vars: `AGENT37_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only — the runtime needs
   it for all DB access), `NEXT_PUBLIC_SITE_URL` (your prod URL).
   **Never add** `SUPABASE_ACCESS_TOKEN` — it's setup-only (used to create/configure the project,
   never at runtime).
   (Branding is code-side now — edit `src/config/branding.ts`, not env.)
4. Register your prod sign-in URL with Supabase: set `NEXT_PUBLIC_SITE_URL` to your prod URL
   in `.env.local` and re-run `npm run setup` (it adds `<prod>/auth/callback` for you).
