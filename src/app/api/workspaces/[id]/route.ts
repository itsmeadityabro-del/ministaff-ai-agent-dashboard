import { requireAdmin, requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";
import type { Workspace } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user, account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }
    await requireAdmin(db, id, user.id);

    const { name } = await readJson<{ name?: string }>(request);
    const trimmed = (name || "").trim();
    if (!trimmed || trimmed.length > 120) {
      throw new ApiError(400, "invalid_request", "Workspace name must be 1–120 characters");
    }

    const { data, error } = await db
      .from("workspaces")
      .update({ name: trimmed })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Workspace not found");

    return json({ workspace: data as Workspace });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }

    // This workspace owns the paid, subscription-managed Agent37 instance.
    // Customer-triggered deletion could destroy a billable resource and leave
    // the portal account pointing at a missing instance, so deprovisioning is
    // reserved for an explicit support/billing lifecycle operation.
    throw new ApiError(
      403,
      "managed_workspace_protected",
      "The MiniStaff workspace cannot be deleted from the customer dashboard. Contact support for account repair.",
    );
  } catch (error) {
    return handleError(error);
  }
}
