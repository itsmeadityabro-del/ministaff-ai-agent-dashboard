import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/lead-triage.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleExports = Object.create(null);
vm.runInNewContext(compiled, { exports: moduleExports }, { timeout: 1000 });
const { parseLeadTriage } = moduleExports;

test("accepts a valid internal lead triage result", () => {
  const result = parseLeadTriage(JSON.stringify({
    qualification: "qualified",
    temperature: "hot",
    confidence: 0.91,
    summary: "Asked for a consultation this week.",
    suggested_next_step: "Have a team member confirm available times.",
    reasons: ["Clear service fit", "Time-sensitive request"],
  }));
  assert.equal(result.qualification, "qualified");
  assert.equal(result.temperature, "hot");
  assert.equal(result.confidence, 0.91);
  assert.equal(result.reasons.length, 2);
});

test("rejects malformed, incomplete, and invalid model output", () => {
  assert.equal(parseLeadTriage("not json"), null);
  assert.equal(parseLeadTriage("[]"), null);
  assert.equal(parseLeadTriage('{"qualification":"qualified"}'), null);
  assert.equal(parseLeadTriage(JSON.stringify({
    qualification: "qualified",
    temperature: "urgent",
    confidence: 0.8,
    summary: "Summary",
    suggested_next_step: "Review",
  })), null);
  assert.equal(parseLeadTriage(JSON.stringify({
    qualification: "qualified",
    temperature: "hot",
    confidence: 1.1,
    summary: "Summary",
    suggested_next_step: "Review",
  })), null);
});

test("bounds text output and reason lists before storing them", () => {
  const result = parseLeadTriage(JSON.stringify({
    qualification: "uncertain",
    temperature: "warm",
    confidence: 0.5,
    summary: "s".repeat(1200),
    suggested_next_step: "n".repeat(800),
    reasons: Array.from({ length: 9 }, (_, i) => "reason " + i),
  }));
  assert.equal(result.summary.length, 600);
  assert.equal(result.suggested_next_step.length, 240);
  assert.equal(result.reasons.length, 5);
});
