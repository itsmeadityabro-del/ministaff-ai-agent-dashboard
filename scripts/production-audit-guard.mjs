import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const LEVELS = ["critical", "high", "moderate", "low"];

export function checkProductionAuditReport(report) {
  const vulnerabilities = report?.metadata?.vulnerabilities;
  if (
    !vulnerabilities ||
    LEVELS.some((level) => !Number.isFinite(vulnerabilities[level]) || vulnerabilities[level] < 0)
  ) {
    return {
      ok: false,
      error: "Blocking staging deployment: production npm audit report has no valid vulnerability summary.",
    };
  }

  const summary = [
    "## Production dependency audit (dev tools excluded)",
    "",
    `- Critical: ${vulnerabilities.critical}`,
    `- High: ${vulnerabilities.high}`,
    `- Moderate: ${vulnerabilities.moderate}`,
    `- Low: ${vulnerabilities.low}`,
    "",
    "Full npm audit JSON is attached to this workflow's build artifact.",
  ].join("\n");

  if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
    return {
      ok: false,
      error: "Blocking staging deployment: production dependencies have critical or high npm audit findings.",
      summary,
      vulnerabilities,
    };
  }

  return { ok: true, summary, vulnerabilities };
}

function main(reportPath) {
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    console.error("Blocking staging deployment: production npm audit report is missing or invalid.");
    process.exitCode = 1;
    return;
  }

  const result = checkProductionAuditReport(report);
  if (result.summary) {
    console.log(result.summary);
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.summary + "\n");
    }
  }
  if (!result.ok) {
    console.error(result.error);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main(process.argv[2] ?? "npm-audit-production-report.json");
}
