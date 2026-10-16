import { requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";
import type { WorkspaceWithRole } from "@/lib/types";

export async function GET() {
  try {
    const { db, account } = await requireMiniStaffAccount();
    if (!account.workspace_id) throw new ApiError(409, "workspace_not_ready", "MiniStaff workspace is not ready");

    const { data, error } = await db
      .from("workspaces")
      .select("*")
      .eq("id", account.workspace_id)
      .maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "MiniStaff workspace not found");

    const workspace: WorkspaceWithRole = { ...data, role: "admin" };
    return json({ workspaces: [workspace] });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_request: Request) {
  try {
    await requireMiniStaffAccount();
    throw new ApiError(
      403,
      "additional_workspaces_disabled",
      "MiniStaff provides one workspace per active subscription. Contact support for account changes.",
    );
  } catch (error) {
    return handleError(error);
  }
}
