import { requireMiniStaffAccount } from "@/lib/auth";
import { isValidTimeRange, isValidTimeZone, normalizeIsoDate } from "@/lib/workflow-validation.mjs";
import { ApiError, handleError, json, readJson } from "@/lib/http";

const STATUSES = ["scheduled", "completed", "cancelled"] as const;
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(request);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ("status" in body) {
      if (typeof body.status !== "string" || !(STATUSES as readonly string[]).includes(body.status)) throw new ApiError(400, "invalid_request", "Unsupported appointment status");
      update.status = body.status;
    }
    if ("title" in body) {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 180) throw new ApiError(400, "invalid_request", "Title must be 1–180 characters");
      update.title = body.title.trim();
    }
    if ("lead_id" in body) {
      if (body.lead_id == null || body.lead_id === "") {
        update.lead_id = null;
      } else {
        if (typeof body.lead_id !== "string" || body.lead_id.length > 64) throw new ApiError(400, "invalid_request", "Lead ID is invalid");
        const { data: lead, error: leadError } = await db.from("leads").select("id")
          .eq("id", body.lead_id).eq("workspace_id", account.workspace_id).maybeSingle();
        if (leadError) throw new ApiError(500, "db_error", leadError.message);
        if (!lead) throw new ApiError(400, "invalid_request", "Selected lead was not found in this workspace");
        update.lead_id = lead.id;
      }
    }
    if ("notes" in body) {
      if (body.notes !== null && typeof body.notes !== "string") throw new ApiError(400, "invalid_request", "Notes must be text");
      const notes = typeof body.notes === "string" ? body.notes.trim() : null;
      if (notes && notes.length > 5000) throw new ApiError(400, "invalid_request", "Notes are too long");
      update.notes = notes;
    }
    for (const field of ["starts_at", "ends_at"] as const) {
      if (field in body) {
        const normalized = normalizeIsoDate(body[field]);
        if (!normalized) throw new ApiError(400, "invalid_request", `${field} must be a valid date/time`);
        update[field] = normalized;
      }
    }
    if ("timezone" in body) {
      if (!isValidTimeZone(body.timezone)) throw new ApiError(400, "invalid_request", "Enter a valid IANA timezone");
      update.timezone = body.timezone;
    }
    if (Object.keys(update).length === 1) throw new ApiError(400, "invalid_request", "No supported fields supplied");
    const { data: current, error: readError } = await db.from("appointments").select("starts_at, ends_at, status")
      .eq("id", id).eq("workspace_id", account.workspace_id).maybeSingle();
    if (readError) throw new ApiError(500, "db_error", readError.message);
    if (!current) throw new ApiError(404, "not_found", "Appointment not found");
    const start = String(update.starts_at ?? current.starts_at);
    const end = String(update.ends_at ?? current.ends_at);
    if (!isValidTimeRange(start, end)) throw new ApiError(400, "invalid_request", "End time must be later than start time");
    const willBeScheduled = (update.status ?? current.status) === "scheduled";
    if (willBeScheduled) {
      const { data: conflicts, error: conflictError } = await db.from("appointments").select("id")
        .eq("workspace_id", account.workspace_id).eq("status", "scheduled")
        .lt("starts_at", end).gt("ends_at", start).neq("id", id).limit(1);
      if (conflictError) throw new ApiError(500, "db_error", conflictError.message);
      if (conflicts?.length) throw new ApiError(409, "appointment_conflict", "This time overlaps an existing scheduled appointment");
    }
    const { data, error } = await db.from("appointments").update(update).eq("id", id)
      .eq("workspace_id", account.workspace_id).select("*").maybeSingle();
    if (error?.code === "23P01") throw new ApiError(409, "appointment_conflict", "This time overlaps an existing scheduled appointment");
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Appointment not found");
    return json({ appointment: data });
  } catch (error) { return handleError(error); }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { id } = await params;
    const { data, error } = await db.from("appointments").delete().eq("id", id)
      .eq("workspace_id", account.workspace_id).select("id").maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Appointment not found");
    return json({ deleted: true, id });
  } catch (error) { return handleError(error); }
}
