# MiniStaff Client Portal — Release Checklist

This file tracks packaging and staging promotion only. Detailed product/workflow status lives in [END_TO_END_CHECKLIST.md](./END_TO_END_CHECKLIST.md). Update existing checklist entries instead of creating duplicate tasks.

- [x] GitHub Actions passed `npm ci`, `npm test`, `npm run typecheck`, and `npm run build` on commit `158b2965ca24b3b7f39f319d143370fee51619b`. [Workflow run](https://github.com/itsmeadityabro-del/ministaff-ai-agent-dashboard/actions/runs/38935121292).
- [ ] Confirm `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` exists only as a server-side binding; never expose it to browser code.
- [ ] Apply and verify Supabase migrations 0002 and 0003 on staging.
- [ ] Confirm activation Worker links paid customers to `ministaff_accounts`; configure its portal Supabase URL/service-role secret separately from the dashboard Worker.
- [ ] Deploy this exact verified commit to Cloudflare staging and record deployment ID.
- [ ] Browser-test signup/confirmation, account bootstrap, lead CRUD, appointment CRUD/conflict rejection, agent chat and usage reporting.
- [ ] Check responsive layout, loading/error/empty states, browser console and server logs.
- [ ] Promote to production only after updating the canonical E2E checklist with dated evidence.
