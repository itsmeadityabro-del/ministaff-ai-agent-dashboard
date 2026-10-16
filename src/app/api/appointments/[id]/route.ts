import { requireAdmin, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user } = await requireUser();
    const { data: existing, error: lookupError } = await db.from("appointments")
      .select("id,workspace_id").eq("id", id).maybeSingle();
    if (lookupError) throw new ApiError(500, "db_error", lookupError.message);
    if (!existing) throw new ApiError(404, "not_found", "Appointment not found");
    await requireAdmin(db, existing.workspace_id, user.id);
    const body = await readJson<{ status?: string }>(request);
    if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      throw new ApiError(400, "invalid_request", "Unsupported appointment status");
    }
    const { data, error } = await db.from("appointments")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id).select("*, leads(name)").single();
    if (error) throw new ApiError(500, "db_error", error.message);
    const related = (data as unknown as { leads?: { name: string } | null }).leads;
    return json({ appointment: { ...data, lead_name: related?.name ?? null, leads: undefined } });
  } catch (error) {
    return handleError(error);
  }
}
