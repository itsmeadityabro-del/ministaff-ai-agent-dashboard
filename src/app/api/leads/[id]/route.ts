import { requireMiniStaffAccount } from "@/lib/auth";
import { isValidEmail } from "@/lib/workflow-validation.mjs";
import { ApiError, handleError, json, readJson } from "@/lib/http";

const STATUSES = ["new", "contacted", "qualified", "converted", "lost"] as const;
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { id } = await params;
    const body = await readJson<Record<string, unknown>>(request);
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ("status" in body) {
      if (typeof body.status !== "string" || !(STATUSES as readonly string[]).includes(body.status)) throw new ApiError(400, "invalid_request", "Unsupported lead status");
      update.status = body.status;
    }
    for (const [field, max] of [["name",160],["email",254],["phone",60],["company",160],["source",80],["notes",5000]] as const) {
      if (!(field in body)) continue;
      const value = body[field];
      if (value !== null && typeof value !== "string") throw new ApiError(400, "invalid_request", `${field} must be text`);
      const clean = typeof value === "string" ? value.trim() : null;
      if (clean && clean.length > max) throw new ApiError(400, "invalid_request", `${field} is too long`);
      if (field === "name" && !clean) throw new ApiError(400, "invalid_request", "Name cannot be empty");
      if (field === "email" && clean && !isValidEmail(clean)) throw new ApiError(400, "invalid_request", "Enter a valid email address");
      update[field] = clean || (field === "source" ? "manual" : null);
    }
    if (Object.keys(update).length === 1) throw new ApiError(400, "invalid_request", "No supported fields supplied");
    const { data, error } = await db.from("leads").update(update).eq("id", id)
      .eq("workspace_id", account.workspace_id).select("*").maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Lead not found");
    return json({ lead: data });
  } catch (error) { return handleError(error); }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "Workspace is not ready");
    const { id } = await params;
    const { data, error } = await db.from("leads").delete().eq("id", id)
      .eq("workspace_id", account.workspace_id).select("id").maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Lead not found");
    return json({ deleted: true, id });
  } catch (error) { return handleError(error); }
}
