import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const apiRoot = fileURLToPath(new URL("../src/app/api/", import.meta.url));
const agentRuntimePath = fileURLToPath(new URL("../src/lib/agent37.ts", import.meta.url));

function routeFiles(directory = apiRoot) {
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...routeFiles(path));
    else if (entry.isFile() && entry.name === "route.ts") result.push(path);
  }
  return result;
}

function source(path) {
  return readFileSync(path, "utf8");
}

function rel(path) {
  return relative(apiRoot, path).replaceAll("\\", "/");
}

const routes = routeFiles().map((path) => ({
  path: rel(path),
  source: source(path),
}));

test("every API route is guarded, except the explicitly public health endpoint", () => {
  assert.ok(routes.length >= 30, "route inventory unexpectedly shrank");
  for (const route of routes) {
    if (route.path === "health/route.ts") continue;

    const guarded =
      route.source.includes("requireUser(") ||
      route.source.includes("requireAgentAccess(") ||
      route.source.includes("authorized(request)") ||
      route.source.includes('headers.get("x-ministaff-webhook-secret")');

    assert.ok(guarded, `API route has no recognized auth/secret guard: ${route.path}`);
  }
});

test("billable agent creation and lifecycle mutations require admin access", () => {
  const agents = routes.find((r) => r.path === "agents/route.ts");
  const agentActions = routes.find((r) => r.path === "agents/[id]/[action]/route.ts");
  assert.ok(agents?.source.includes("await requireAdmin(db, workspaceId, user.id)"));
  assert.ok(agentActions?.source.includes('requireAgentAccess(id, "admin")'));
});

test("lead and appointment mutations are admin-only while reads require membership", () => {
  for (const path of ["leads/route.ts", "appointments/route.ts"]) {
    const route = routes.find((r) => r.path === path);
    assert.ok(route?.source.includes("await requireMember(db, workspaceId, user.id)"), `${path} reads must be member-gated`);
    assert.ok(route?.source.includes("await requireAdmin(db, workspaceId, user.id)"), `${path} writes must be admin-gated`);
  }
});

test("Agent37 credentials are server-only and are not sourced from a client-prefixed variable", () => {
  const runtime = source(agentRuntimePath);
  assert.match(runtime, /^import ["']server-only["'];/);
  assert.match(runtime, /process\.env\.AGENT37_API_KEY/);
  assert.doesNotMatch(runtime, /NEXT_PUBLIC_AGENT37_API_KEY/);
});
