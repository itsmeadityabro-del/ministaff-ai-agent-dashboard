import { requireAdmin, requireMember, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";

const TEMPERATURES = ["hot", "warm", "cold"] as const;

export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser();
    const workspaceId = new URL(request.url).searchParams.get("workspace");
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace query param is required");
    await requireMember(db, workspaceId, user.id);
    const { data, error } = await db.from("leads").select("*")
      .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(500);
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ leads: data ?? [] });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await requireUser();
    const body = await readJson<{
      workspace_id?: string; name?: string; company?: string | null; email?: string | null;
      phone?: string | null; source?: string; temperature?: string;
    }>(request);
    const workspaceId = body.workspace_id?.trim();
    const name = body.name?.trim();
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace_id is required");
    if (!name) throw new ApiError(400, "invalid_request", "Lead name is required");
    if (name.length > 160) throw new ApiError(400, "invalid_request", "Lead name is too long");
    await requireAdmin(db, workspaceId, user.id);
    const temperature = TEMPERATURES.includes(body.temperature as (typeof TEMPERATURES)[number]) ? body.temperature : "warm";
    const { data, error } = await db.from("leads").insert({
      workspace_id: workspaceId, name,
      company: body.company?.trim() || null,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      source: (body.source?.trim() || "manual").slice(0, 64),
      temperature, status: "new", created_by: user.id,
    }).select("*").single();
    if (error) throw new ApiError(500, "db_error", error.message);
    return json({ lead: data }, 201);
  } catch (error) {
    return handleError(error);
  }
}
