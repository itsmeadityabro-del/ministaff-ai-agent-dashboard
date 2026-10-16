export function isValidEmail(value: unknown): value is string;
export function normalizeIsoDate(value: unknown): string | null;
export function isValidTimeRange(start: string, end: string): boolean;
export function rangesOverlap(start: string, end: string, otherStart: string, otherEnd: string): boolean;
export function isValidTimeZone(value: unknown): value is string;
