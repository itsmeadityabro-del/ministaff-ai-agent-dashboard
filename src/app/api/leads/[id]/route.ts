import { requireAdmin, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["new", "qualified", "contacted", "booked", "lost"] as const;
const TEMPERATURES = ["hot", "warm", "cold"] as const;

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user } = await requireUser();
    const { data: existing, error: lookupError } = await db.from("leads")
      .select("id,workspace_id").eq("id", id).maybeSingle();
    if (lookupError) throw new ApiError(500, "db_error", lookupError.message);
    if (!existing) throw new ApiError(404, "not_found", "Lead not found");
    await requireAdmin(db, existing.workspace_id, user.id);

    const body = await readJson<{ status?: string; temperature?: string }>(request);
    const patch: { status?: (typeof STATUSES)[number]; temperature?: (typeof TEMPERATURES)[number]; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status as (typeof STATUSES)[number])) throw new ApiError(400, "invalid_request", "Unsupported lead status");
      patch.status = body.status as (typeof STATUSES)[number];
    }
    if (body.temperature !== undefined) {
      if (!TEMPERATURES.includes(body.temperature as (typeof TEMPERATURES)[number])) throw new ApiError(400, "invalid_request", "Unsupported lead priority");
      patch.temperature = body.temperature as (typeof TEMPERATURES)[number];
    }
    if (!patch.status && !patch.temperature) throw new ApiError(400, "invalid_request", "No supported fields to update");
    const { data, error } = await db.from("leads").update(patch).eq("id", id).select("*").single();
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ lead: data });
  } catch (error) {
    return handleError(error);
  }
}
