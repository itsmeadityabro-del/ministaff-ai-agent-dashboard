export type UsageMonthResolution =
  | { ok: true; month: string | undefined }
  | { ok: false; code: "invalid_month" | "future_month"; message: string };

// Aligns with the dashboard's YYYY-MM control and prevents malformed/future periods
// from being sent to Agent37. The clock is injectable so date-boundary behavior is testable.
export function resolveUsageMonth(value: string | null, now: Date = new Date()): UsageMonthResolution {
  if (value === null || value === "") return { ok: true, month: undefined };

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return { ok: false, code: "invalid_month", message: "month must use YYYY-MM format" };
  }

  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  if (value > currentMonth) {
    return { ok: false, code: "future_month", message: "month cannot be in the future" };
  }

  return { ok: true, month: value };
}
