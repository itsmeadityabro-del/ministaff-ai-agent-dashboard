import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/http.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleExports = Object.create(null);
class StubAgent37Error extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
vm.runInNewContext(compiled, {
  exports: moduleExports,
  require(specifier) {
    if (specifier === "next/server") return { NextResponse: { json: (body, init) => ({ body, init }) } };
    if (specifier === "@/lib/agent37") return { Agent37Error: StubAgent37Error };
    throw new Error("Unexpected import in test: " + specifier);
  },
  TextDecoder,
  Uint8Array,
  Response,
  Number,
  JSON,
  Error,
  console,
}, { timeout: 1000 });

const { readJson, ApiError } = moduleExports;

test("readJson accepts valid JSON within the requested limit", async () => {
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Lead A" }),
  });
  assert.deepEqual(await readJson(request, 100), { name: "Lead A" });
});

test("readJson rejects a declared body size above the limit before reading the body", async () => {
  // Fetch Request strips some transport-controlled headers such as Content-Length, so use the
  // minimal Request interface to exercise the early header guard deterministically.
  const request = {
    headers: { get: (name) => name.toLowerCase() === "content-length" ? "1000" : null },
    body: new ReadableStream({ start(controller) { controller.close(); } }),
  };
  await assert.rejects(readJson(request, 10), (error) => {
    assert.equal(error.code, "payload_too_large");
    assert.equal(error.status, 413);
    return true;
  });
});

test("readJson enforces the actual streamed size even without a trustworthy Content-Length", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('{"value":"a payload larger than the allowed limit"}'));
      controller.close();
    },
  });
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  });
  await assert.rejects(readJson(request, 12), (error) => {
    assert.equal(error.code, "payload_too_large");
    assert.equal(error.status, 413);
    return true;
  });
});

test("readJson preserves the existing safe empty-object fallback for malformed JSON", async () => {
  const request = new Request("https://example.test/api", { method: "POST", body: "{not-json" });
  const result = await readJson(request, 100);
  assert.equal(Object.keys(result).length, 0);
});

test("JSON API responses are marked no-store", () => {
  const response = moduleExports.json({ workspace: "private" }, 200);
  assert.equal(response.init.headers["Cache-Control"], "no-store");
  assert.equal(response.init.status, 200);
});

test("JSON API errors are marked no-store", () => {
  const response = moduleExports.apiError("Not found", 404, "not_found");
  assert.equal(response.init.headers["Cache-Control"], "no-store");
  assert.equal(response.init.status, 404);
});
