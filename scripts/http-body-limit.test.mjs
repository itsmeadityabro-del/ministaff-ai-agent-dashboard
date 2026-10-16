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
  const request = new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "1000" },
    body: "{}",
  });
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
  assert.deepEqual(await readJson(request, 100), {});
});
