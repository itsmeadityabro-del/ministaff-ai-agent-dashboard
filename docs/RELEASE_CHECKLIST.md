# MiniStaff Client Portal — Release Checklist

This file tracks packaging and staging promotion only. Detailed product/workflow status lives in [END_TO_END_CHECKLIST.md](./END_TO_END_CHECKLIST.md). Update existing checklist entries instead of creating duplicate tasks.

- [x] GitHub Actions passed `npm ci`, `npm test` (14 tests), typecheck, and production build with synchronized semver-compatible dependency updates; resulting branch head `bdee59f6f2eedc727d25c24b8952ddd71074fae0`. [Workflow run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38937092828).
- [ ] Confirm `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` exists only as a server-side binding; never expose it to browser code.
- [ ] Apply and verify Supabase migrations 0002, 0003, and 0004 on staging; 0004 revokes browser access to MiniStaff tables and security-definer RPCs.
- [ ] Confirm activation Worker links paid customers to `ministaff_accounts`; configure its portal Supabase URL/service-role secret separately from the dashboard Worker. Customer APIs must not create/delete workspaces or agents, invite extra users, resize compute, or exceed the tier's managed-spend cap.
- [ ] Deploy this exact verified commit to Cloudflare staging and record deployment ID.
- [ ] Browser-test signup/confirmation, account bootstrap, lead CRUD, appointment CRUD/conflict rejection, agent chat and usage reporting.
- [ ] Review and resolve the 3 remaining low npm advisories in `streamdown`, `mermaid`, and `katex` before production.
- [ ] Check responsive layout, loading/error/empty states, browser console and server logs.
- [ ] Promote to production only after updating the canonical E2E checklist with dated evidence.
