export type LeadQualification = "qualified" | "unqualified" | "uncertain";
export type LeadTemperature = "hot" | "warm" | "cold";

export interface LeadTriageResult {
  qualification: LeadQualification;
  temperature: LeadTemperature;
  confidence: number;
  summary: string;
  suggested_next_step: string;
  reasons: string[];
}

// Treat model output as untrusted data. Invalid or incomplete JSON must go to a human
// for review rather than being used to change lead state or trigger external actions.
export function parseLeadTriage(output: string): LeadTriageResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(output);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const row = parsed as Record<string, unknown>;
  const qualification = row.qualification;
  const temperature = row.temperature;
  const confidence = row.confidence;
  const summary = typeof row.summary === "string" ? row.summary.trim() : "";
  const suggested = typeof row.suggested_next_step === "string" ? row.suggested_next_step.trim() : "";

  if (qualification !== "qualified" && qualification !== "unqualified" && qualification !== "uncertain") return null;
  if (temperature !== "hot" && temperature !== "warm" && temperature !== "cold") return null;
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
  if (!summary || !suggested) return null;

  const reasons = Array.isArray(row.reasons)
    ? row.reasons
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 180))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return {
    qualification,
    temperature,
    confidence,
    summary: summary.slice(0, 600),
    suggested_next_step: suggested.slice(0, 240),
    reasons,
  };
}
