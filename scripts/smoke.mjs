#!/usr/bin/env node
// Opt-in, manual smoke test — NOT run in CI and NOT free. It spends a few cents of
// real managed/compute money against the wallet behind AGENT37_API_KEY: it creates a
// real instance, waits for it, sends ONE chat turn over the data plane, and deletes it.
//
// This is BILLABLE. No instance is created unless an explicit approval flag is supplied:
//   AGENT37_API_KEY=... node scripts/smoke.mjs --budget-approved
// (reads AGENT37_API_KEY from the environment or .env.local). Keeping the instance requires
// BOTH --keep and --keep-approved; otherwise the script always attempts deletion.
//
// This talks straight to the Agent37 API (control plane + the instance's data plane),
// the same surfaces src/lib/agent37.ts wraps — so a green run proves the API contract
// the app depends on still holds end to end.

import { readFileSync } from "node:fs";

const API = process.env.AGENT37_API || "https://api.agent37.com/v1";
const KEEP = process.argv.includes("--keep");
const BUDGET_APPROVED = process.argv.includes("--budget-approved");
const KEEP_APPROVED = process.argv.includes("--keep-approved");

if (!BUDGET_APPROVED) {
  console.error(
    "This smoke test creates a real Agent37 instance and sends a chat request. " +
    "It will not run without --budget-approved after the account owner confirms the permitted test spend."
  );
  process.exit(2);
}
if (KEEP && !KEEP_APPROVED) {
  console.error("Leaving a test instance running requires both --keep and --keep-approved.");
  process.exit(2);
}

function readEnv(name) {
  if (process.env[name]) return process.env[name];
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(new RegExp(`^${name}=(.*)$`));
      if (m) return m[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {}
  return undefined;
}

const KEY = readEnv("AGENT37_API_KEY");
if (!KEY || !KEY.startsWith("sk_live_")) {
  console.error("Set AGENT37_API_KEY (sk_live_...) in the env or .env.local first.");
  process.exit(1);
}

const auth = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const dataAuth = { "X-Agent37-Key": KEY, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("→ creating instance (agent37-hermes, $0.50 credit)…");
  const created = await fetch(`${API}/instances`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ name: "starter-kit-smoke", budget: { credit_micros: 500000 } }),
  });
  if (!created.ok) throw new Error(`create failed ${created.status}: ${await created.text()}`);
  const inst = await created.json();
  console.log(`  id=${inst.id} status=${inst.status}`);
  const base = `https://${inst.id}.agent37.app`;

  try {
    console.log("→ waiting for health…");
    for (let i = 0; i < 60; i++) {
      const h = await fetch(`${base}/v1/health`, { headers: dataAuth }).catch(() => null);
      if (h?.ok) {
        const body = await h.json().catch(() => ({}));
        if (body.ok) break;
      }
      await sleep(2000);
      if (i === 59) throw new Error("health never went ok");
    }
    console.log("  healthy");

    console.log("→ sending one chat turn…");
    const r = await fetch(`${base}/v1/responses`, {
      method: "POST",
      headers: dataAuth,
      body: JSON.stringify({ input: "Reply with exactly: smoke ok" }),
    });
    if (!r.ok) throw new Error(`responses failed ${r.status}: ${await r.text()}`);
    const out = await r.json();
    const text = JSON.stringify(out).slice(0, 200);
    console.log(`  got a response: ${text}…`);
    console.log("\n✅ smoke passed: create → health → chat all worked.");
  } finally {
    if (KEEP) {
      console.log(`\n(--keep) leaving ${inst.id} running. Delete it yourself when done.`);
    } else {
      console.log("→ deleting instance…");
      const d = await fetch(`${API}/instances/${inst.id}`, { method: "DELETE", headers: auth });
      console.log(d.ok ? "  deleted." : `  delete failed ${d.status} — delete ${inst.id} manually.`);
    }
  }
}

main().catch((e) => {
  console.error("\n❌ smoke failed:", e.message);
  process.exit(1);
});
