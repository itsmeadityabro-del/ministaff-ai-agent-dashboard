import { requireMember, requireUser } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser();
    const workspaceId = new URL(request.url).searchParams.get("workspace");
    if (!workspaceId) throw new ApiError(400, "invalid_request", "workspace query param is required");
    await requireMember(db, workspaceId, user.id);

    const { data, error } = await db.from("lead_jobs")
      .select("id,workspace_id,lead_id,idempotency_key,status,attempt_count,available_at,locked_at,last_error,created_at,updated_at,leads(name,email,source)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new ApiError(500, "db_error", error.message);
    const jobs = (data ?? []).map((row) => {
      const related = (row as unknown as { leads?: { name: string; email: string | null; source: string } | null }).leads;
      return { ...row, lead_name: related?.name ?? "Lead", lead_email: related?.email ?? null, lead_source: related?.source ?? null, leads: undefined };
    });
    return json({ jobs });
  } catch (error) {
    return handleError(error);
  }
}
