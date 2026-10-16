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
