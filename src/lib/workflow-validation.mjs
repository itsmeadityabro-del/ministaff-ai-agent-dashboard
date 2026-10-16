export function isValidEmail(value) {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function normalizeIsoDate(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

export function isValidTimeRange(start, end) {
  const startTime = Date.parse(start);
  const endTime = Date.parse(end);
  return Number.isFinite(startTime) && Number.isFinite(endTime) && endTime > startTime;
}

export function rangesOverlap(start, end, otherStart, otherEnd) {
  const a = Date.parse(start);
  const b = Date.parse(end);
  const c = Date.parse(otherStart);
  const d = Date.parse(otherEnd);
  return [a, b, c, d].every(Number.isFinite) && a < d && b > c;
}

export function isValidTimeZone(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 80) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(0);
    return true;
  } catch {
    return false;
  }
}
