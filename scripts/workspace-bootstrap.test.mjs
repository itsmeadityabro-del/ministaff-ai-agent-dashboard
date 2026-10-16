import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/0006_idempotent_workspace_bootstrap.sql", import.meta.url),
  "utf8",
);
const compact = migration.replace(/\s+/g, " ").toLowerCase();

test("workspace bootstrap serializes per user and reuses an existing membership", () => {
  assert.match(compact, /pg_advisory_xact_lock\(hashtextextended\(p_user::text, 0\)\)/);
  assert.match(compact, /where m\.user_id = p_user/);
  assert.match(compact, /on conflict \(workspace_id, user_id\) do nothing/);
});

test("workspace bootstrap is callable only by the verified-session server role", () => {
  assert.ok(compact.includes(
    "revoke all privileges on function public.ensure_default_workspace(uuid) from public, anon, authenticated;",
  ));
  assert.ok(compact.includes(
    "grant execute on function public.ensure_default_workspace(uuid) to service_role;",
  ));
});
