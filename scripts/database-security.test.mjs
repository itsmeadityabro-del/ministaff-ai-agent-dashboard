import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/0005_rpc_privilege_hardening.sql", import.meta.url),
  "utf8",
);

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("security-definer functions are explicitly revoked from browser roles", () => {
  for (const signature of serviceOnlyFunctions) {
    const escaped = escapeRegExp(signature);
    assert.match(
      migration,
      new RegExp(
        `REVOKE ALL PRIVILEGES ON FUNCTION ${escaped}\\s+FROM PUBLIC, anon, authenticated;`,
        "i",
      ),
      `missing browser-role revoke for ${signature}`,
    );
  }
});

test("server-side RPCs needed by the BFF and queue worker remain granted to service_role", () => {
  for (const signature of serviceOnlyFunctions) {
    const escaped = escapeRegExp(signature);
    assert.match(
      migration,
      new RegExp(
        `GRANT EXECUTE ON FUNCTION ${escaped}\\s+TO service_role;`,
        "i",
      ),
      `missing service_role grant for ${signature}`,
    );
  }
});

test("the migration does not re-grant EXECUTE to PUBLIC, anon, or authenticated", () => {
  assert.doesNotMatch(
    migration,
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION[\s\S]*?\sTO\s+(?:PUBLIC|anon|authenticated)\s*;/i,
  );
});
