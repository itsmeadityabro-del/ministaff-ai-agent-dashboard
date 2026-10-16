import { requireAdmin, requireMember, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser();
    const workspaceId = new URL(request.url).searchParams.get("workspace");
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace query param is required");
    await requireMember(db, workspaceId, user.id);
    const { data, error } = await db.from("appointments").select("*, leads(name)")
      .eq("workspace_id", workspaceId).order("starts_at", { ascending: true }).limit(500);
    if (error) throw new ApiError(500, "db_error", error.message);
    const appointments = (data ?? []).map((row) => {
      const related = (row as unknown as { leads?: { name: string } | null }).leads;
      return { ...row, lead_name: related?.name ?? null, leads: undefined };
    });
    return json({ appointments });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser();
    const body = await readJson<{
      workspace_id?: string; lead_id?: string | null; title?: string;
      starts_at?: string; ends_at?: string; location?: string | null; notes?: string | null;
    }>(request);
    const workspaceId = body.workspace_id?.trim();
    const title = body.title?.trim();
    const start = body.starts_at ? new Date(body.starts_at) : null;
    const end = body.ends_at ? new Date(body.ends_at) : null;
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace_id is required");
    if (!title) throw new ApiError(400, "invalid_request", "Appointment title is required");
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new ApiError(400, "invalid_request", "A valid start and end time are required, and end must be after start");
    }
    await requireAdmin(db, workspaceId, user.id);
    if (body.lead_id) {
      const { data: lead, error } = await db.from("leads").select("id")
        .eq("id", body.lead_id).eq("workspace_id", workspaceId).maybeSingle();
      if (error) throw new ApiError(500, "db_error", error.message);
      if (!lead) throw new ApiError(400, "invalid_request", "The selected lead does not belong to this workspace");
    }
    const { data, error } = await db.from("appointments").insert({
      workspace_id: workspaceId, lead_id: body.lead_id || null, title: title.slice(0, 180),
      starts_at: start.toISOString(), ends_at: end.toISOString(), status: "pending",
      location: body.location?.trim() || null, notes: body.notes?.trim() || null, created_by: user.id,
    }).select("*, leads(name)").single();
    if (error) throw new ApiError(500, "db_error", error.message);
    const related = (data as unknown as { leads?: { name: string } | null }).leads;
    return json({ appointment: { ...data, lead_name: related?.name ?? null, leads: undefined } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
