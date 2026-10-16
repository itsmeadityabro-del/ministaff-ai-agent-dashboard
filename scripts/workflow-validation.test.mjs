import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmail, normalizeIsoDate, isValidTimeRange, rangesOverlap, isValidTimeZone } from "../src/lib/workflow-validation.mjs";

test("email validation accepts ordinary addresses and rejects malformed or oversized values", () => {
  assert.equal(isValidEmail("lead@example.com"), true);
  assert.equal(isValidEmail("name+sales@company.co.in"), true);
  assert.equal(isValidEmail("missing-at-sign.example.com"), false);
  assert.equal(isValidEmail("bad@"), false);
  assert.equal(isValidEmail("x".repeat(250) + "@example.com"), false);
  assert.equal(isValidEmail(null), false);
});

test("ISO date normalization returns canonical UTC timestamps and rejects invalid inputs", () => {
  assert.equal(normalizeIsoDate("2026-10-16T12:30:00.000Z"), "2026-10-16T12:30:00.000Z");
  assert.equal(normalizeIsoDate("not a date"), null);
  assert.equal(normalizeIsoDate(""), null);
  assert.equal(normalizeIsoDate(null), null);
});

test("appointment ranges must end after they start", () => {
  assert.equal(isValidTimeRange("2026-10-16T10:00:00Z", "2026-10-16T10:30:00Z"), true);
  assert.equal(isValidTimeRange("2026-10-16T10:30:00Z", "2026-10-16T10:30:00Z"), false);
  assert.equal(isValidTimeRange("2026-10-16T11:00:00Z", "2026-10-16T10:00:00Z"), false);
  assert.equal(isValidTimeRange("invalid", "2026-10-16T10:00:00Z"), false);
});

test("appointment overlap uses half-open intervals, allowing back-to-back meetings", () => {
  assert.equal(rangesOverlap("2026-10-16T10:00:00Z", "2026-10-16T10:30:00Z", "2026-10-16T10:15:00Z", "2026-10-16T10:45:00Z"), true);
  assert.equal(rangesOverlap("2026-10-16T10:00:00Z", "2026-10-16T10:30:00Z", "2026-10-16T10:30:00Z", "2026-10-16T11:00:00Z"), false);
  assert.equal(rangesOverlap("2026-10-16T10:00:00Z", "2026-10-16T10:30:00Z", "2026-10-16T09:00:00Z", "2026-10-16T11:00:00Z"), true);
});

test("IANA timezone validation accepts real zones and rejects arbitrary strings", () => {
  assert.equal(isValidTimeZone("Asia/Kolkata"), true);
  assert.equal(isValidTimeZone("UTC"), true);
  assert.equal(isValidTimeZone("not/a-timezone"), false);
  assert.equal(isValidTimeZone(""), false);
});
