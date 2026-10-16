import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("privileged Supabase credentials are server-only and accept the deployed secret alias", async () => {
  const admin = await read("../src/lib/supabase/admin.ts");
  assert.match(admin, /import ["']server-only["']/);
  assert.match(admin, /SUPABASE_SERVICE_ROLE_KEY\s*\|\|\s*process\.env\.SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(await read("../src/lib/supabase/client.ts"), /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/);
});

test("workflow APIs authenticate and scope each record to the active MiniStaff workspace", async () => {
  const paths = ["../src/app/api/leads/route.ts", "../src/app/api/leads/[id]/route.ts", "../src/app/api/appointments/route.ts", "../src/app/api/appointments/[id]/route.ts"];
  for (const path of paths) {
    const source = await read(path);
    assert.match(source, /requireMiniStaffAccount/);
    assert.match(source, /workspace_id/);
  }
  assert.match(await read("../src/app/api/appointments/[id]/route.ts"), /appointment_conflict/);
});

test("workflow migration enables RLS, denies browser table access, and protects scheduled overlap", async () => {
  const sql = await read("../supabase/migrations/0003_ministaff_workflows.sql");
  assert.match(sql, /create table if not exists public\.leads/i);
  assert.match(sql, /create table if not exists public\.appointments/i);
  assert.match(sql, /alter table public\.leads enable row level security/i);
  assert.match(sql, /revoke all on public\.leads, public\.appointments from anon, authenticated/i);
  assert.match(sql, /appointments_no_scheduled_overlap/i);
});


test("customer API cannot create or delete a subscription-managed Agent37 instance", async () => {
  const collection = await read("../src/app/api/agents/route.ts");
  const item = await read("../src/app/api/agents/[id]/route.ts");
  assert.match(collection, /additional_agents_disabled/);
  assert.match(item, /managed_agent_protected/);
  assert.doesNotMatch(item, /agent37\.deleteAgent\(/);
});


test("managed workspace cannot be deleted or expanded into extra workspaces", async () => {
  const workspaceItem = await read("../src/app/api/workspaces/[id]/route.ts");
  const workspaceCollection = await read("../src/app/api/workspaces/route.ts");
  assert.match(workspaceItem, /managed_workspace_protected/);
  assert.doesNotMatch(workspaceItem, /agent37\\.deleteAgent\\s*\\(/);
  assert.match(workspaceCollection, /requireMiniStaffAccount/);
  assert.match(workspaceCollection, /additional_workspaces_disabled/);
});

test("agent data is scoped to the linked MiniStaff account, not a caller-selected workspace", async () => {
  const source = await read("../src/app/api/agents/route.ts");
  assert.match(source, /requireMiniStaffAccount/);
  assert.match(source, /workspaceId !== account\\.workspace_id/);
  assert.match(source, /eq\\("agent37_id", account\\.agent37_id\\)/);
  assert.match(source, /additional_agents_disabled/);
});

test("legacy team routes and UI cannot add users or remove managed membership", async () => {
  const members = await read("../src/app/api/workspaces/[id]/members/route.ts");
  const removeMember = await read("../src/app/api/workspaces/[id]/members/[userId]/route.ts");
  const revokeInvite = await read("../src/app/api/workspaces/[id]/invitations/[token]/route.ts");
  const acceptInvite = await read("../src/app/api/invitations/[token]/route.ts");
  const invitePage = await read("../src/app/invite/[token]/page.tsx");
  const accountMenu = await read("../src/components/AccountMenu.tsx");
  const settings = await read("../src/components/SettingsView.tsx");
  assert.match(members, /team_invitations_disabled/);
  assert.match(removeMember, /team_membership_protected/);
  assert.match(revokeInvite, /team_invitations_disabled/);
  assert.match(acceptInvite, /team_invitations_disabled/);
  assert.match(invitePage, /Team invitations are not enabled/);
  assert.doesNotMatch(accountMenu, /New workspace/);
  assert.doesNotMatch(settings, /Delete workspace/);
});
