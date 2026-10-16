import { requireMiniStaffAccount } from "@/lib/auth";
import { isValidTimeRange, isValidTimeZone, normalizeIsoDate } from "@/lib/workflow-validation.mjs";
import { ApiError, handleError, json, readJson } from "@/lib/http";

type AppointmentInput = { title?: unknown; lead_id?: unknown; starts_at?: unknown; ends_at?: unknown; timezone?: unknown; status?: unknown; notes?: unknown };
const STATUSES = ["scheduled", "completed", "cancelled"] as const;
function text(value: unknown, field: string, max: number, required = false): string | null {
  if (value == null || value === "") { if (required) throw new ApiError(400, "invalid_request", `${field} is required`); return null; }
  if (typeof value !== "string") throw new ApiError(400, "invalid_request", `${field} must be text`);
  const clean = value.trim();
  if (required && !clean) throw new ApiError(400, "invalid_request", `${field} is required`);
  if (clean.length > max) throw new ApiError(400, "invalid_request", `${field} is too long`);
  return clean || null;
}
function validDate(value: unknown, field: string): string {
  const normalized = normalizeIsoDate(value);
  if (!normalized) throw new ApiError(400, "invalid_request", `${field} must be a valid date/time`);
  return normalized;
}

export async function GET() {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { data, error } = await db.from("appointments")
      .select("id, lead_id, title, starts_at, ends_at, timezone, status, notes, created_at, updated_at, leads(name)")
      .eq("workspace_id", account.workspace_id).order("starts_at", { ascending: true }).limit(500);
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ appointments: data ?? [] });
  } catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const { db, user, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const body = await readJson<AppointmentInput>(request);
    const title = text(body.title, "Title", 180, true)!;
    const starts_at = validDate(body.starts_at, "Start time");
    const ends_at = validDate(body.ends_at, "End time");
    if (!isValidTimeRange(starts_at, ends_at)) throw new ApiError(400, "invalid_request", "End time must be later than start time");
    const timezone = text(body.timezone, "Timezone", 80) ?? "UTC";
    if (!isValidTimeZone(timezone)) throw new ApiError(400, "invalid_request", "Enter a valid IANA timezone");
    const lead_id = text(body.lead_id, "Lead ID", 64);
    if (lead_id) {
      const { data: lead, error: leadError } = await db.from("leads").select("id")
        .eq("id", lead_id).eq("workspace_id", account.workspace_id).maybeSingle();
      if (leadError) throw new ApiError(500, "db_error", leadError.message);
      if (!lead) throw new ApiError(400, "invalid_request", "Selected lead was not found in this workspace");
    }
    const status = body.status == null ? "scheduled" : body.status;
    if (typeof status !== "string" || !(STATUSES as readonly string[]).includes(status)) throw new ApiError(400, "invalid_request", "Unsupported appointment status");
    const { data, error } = await db.from("appointments").insert({
      workspace_id: account.workspace_id, created_by: user.id, lead_id, title, starts_at, ends_at, timezone, status,
      notes: text(body.notes, "Notes", 5000),
    }).select("*").single();
    if (error?.code === "23P01") throw new ApiError(409, "appointment_conflict", "This time overlaps an existing scheduled appointment");
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ appointment: data }, 201);
  } catch (error) { return handleError(error); }
}
