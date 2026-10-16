import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/0007_least_privilege_workspace_members.sql", import.meta.url),
  "utf8",
);
const compact = migration.replace(/\s+/g, " ").toLowerCase();

test("workspace roles permit only admin and member", () => {
  assert.match(compact, /check \(role in \('admin', 'member'\)\)/);
  assert.equal((compact.match(/check \(role in \('admin', 'member'\)\)/g) ?? []).length, 2);
});

test("invitation acceptance is single-use and cannot change an existing role", () => {
  assert.match(compact, /where token = p_token for update/);
  assert.match(compact, /on conflict \(workspace_id, user_id\) do nothing/);
  assert.match(compact, /delete from public\.invitations where token = p_token/);
  assert.match(compact, /if p_user is null/);
});

test("invitation acceptance remains service-role-only", () => {
  assert.ok(compact.includes(
    "revoke all privileges on function public.accept_invitation(uuid, uuid) from public, anon, authenticated;",
  ));
  assert.ok(compact.includes(
    "grant execute on function public.accept_invitation(uuid, uuid) to service_role;",
  ));
});
