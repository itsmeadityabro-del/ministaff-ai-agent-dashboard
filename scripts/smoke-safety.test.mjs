import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./smoke.mjs", import.meta.url));

test("billable Agent37 smoke test stops before network calls without budget approval", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, AGENT37_API_KEY: "" },
    timeout: 5_000,
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /will not run without --budget-approved/i);
  assert.doesNotMatch(result.stdout + result.stderr, /creating instance/i);
});

test("billable Agent37 smoke test cannot leave an instance running without a second approval", () => {
  const result = spawnSync(process.execPath, [script, "--budget-approved", "--keep"], {
    encoding: "utf8",
    env: { ...process.env, AGENT37_API_KEY: "" },
    timeout: 5_000,
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /requires both --keep and --keep-approved/i);
  assert.doesNotMatch(result.stdout + result.stderr, /creating instance/i);
});
