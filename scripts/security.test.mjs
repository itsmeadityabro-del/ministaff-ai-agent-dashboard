import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/site-url.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleExports = Object.create(null);
vm.runInNewContext(compiled, {
  exports: moduleExports,
  process,
  URL,
}, { timeout: 1000 });
const { safeNextPath, normalizeOrigin } = moduleExports;

test("allows ordinary internal destinations", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/dashboard?tab=leads"), "/dashboard?tab=leads");
  assert.equal(safeNextPath("/reset-password"), "/reset-password");
});

test("rejects external and protocol-relative redirect destinations", () => {
  for (const value of ["https://evil.example", "//evil.example", "///evil.example", "javascript:alert(1)", "evil.example"]) {
    assert.equal(safeNextPath(value), "/dashboard", "should reject " + value);
  }
});

test("rejects backslashes and control characters in redirect destinations", () => {
  for (const value of ["/\\evil.example", "/\\\\evil.example", "/dashboard\nhttps://evil.example", "/dashboard\u0000"]) {
    assert.equal(safeNextPath(value), "/dashboard", "should reject " + JSON.stringify(value));
  }
});

test("normalizes allowed HTTP(S) origins and rejects unsupported schemes", () => {
  assert.equal(normalizeOrigin("ministaff-ai.pages.dev/path"), "https://ministaff-ai.pages.dev");
  assert.equal(normalizeOrigin("http://localhost:3000/login"), "http://localhost:3000");
  assert.equal(normalizeOrigin("javascript:alert(1)"), null);
  assert.equal(normalizeOrigin(""), null);
});


const authPolicySource = readFileSync(new URL("../src/lib/auth-policy.ts", import.meta.url), "utf8");
const authPolicyCompiled = ts.transpileModule(authPolicySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const authPolicyExports = Object.create(null);
vm.runInNewContext(authPolicyCompiled, { exports: authPolicyExports }, { timeout: 1000 });
const { hasVerifiedEmail } = authPolicyExports;

test("protected access requires a verified email timestamp", () => {
  assert.equal(hasVerifiedEmail(null), false);
  assert.equal(hasVerifiedEmail(undefined), false);
  assert.equal(hasVerifiedEmail({}), false);
  assert.equal(hasVerifiedEmail({ email_confirmed_at: null }), false);
  assert.equal(hasVerifiedEmail({ email_confirmed_at: "" }), false);
  assert.equal(hasVerifiedEmail({ email_confirmed_at: "2026-10-16T00:00:00Z" }), true);
});
