import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/0005_rpc_privilege_hardening.sql", import.meta.url),
  "utf8",
);
const normalizedMigration = migration.replace(/\s+/g, " ").toLowerCase();

const serviceOnlyFunctions = [
  "public.is_workspace_member(uuid)",
  "public.is_workspace_admin(uuid)",
  "public.handle_new_workspace()",
  "public.get_workspace_members(uuid)",
  "public.get_invitation(uuid)",
  "public.accept_invitation(uuid, uuid)",
  "public.ingest_lead_event(uuid, text, text, text, text, text, text, text, text)",
  "public.claim_lead_jobs(integer)",
];

test("security-definer functions are explicitly revoked from browser roles", () => {
  for (const signature of serviceOnlyFunctions) {
    assert.ok(
      normalizedMigration.includes(
        `revoke all privileges on function ${signature.toLowerCase()} from public, anon, authenticated;`,
      ),
      `missing browser-role revoke for ${signature}`,
    );
  }
});

test("server-side RPCs remain granted to service_role", () => {
  for (const signature of serviceOnlyFunctions) {
    assert.ok(
      normalizedMigration.includes(
        `grant execute on function ${signature.toLowerCase()} to service_role;`,
      ),
      `missing service_role grant for ${signature}`,
    );
  }
});

test("the migration does not re-grant EXECUTE to PUBLIC, anon, or authenticated", () => {
  assert.doesNotMatch(
    normalizedMigration,
    /grant\s+execute\s+on\s+function[\s\S]*?\s+to\s+(?:public|anon|authenticated)\s*;/i,
  );
});
