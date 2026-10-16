import { requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";
import type { Role, WorkspaceMember } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user, account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }

    const { data, error } = await db
      .from("memberships")
      .select("workspace_id, user_id, role, created_at")
      .eq("workspace_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "db_error", error.message);
    if (!data) throw new ApiError(404, "not_found", "Membership not found");

    const member: WorkspaceMember = {
      user_id: user.id,
      email: user.email ?? "",
      role: data.role as Role,
      created_at: data.created_at,
    };
    return json({ members: [member], invitations: [], role: data.role as Role });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }
    throw new ApiError(
      403,
      "team_invitations_disabled",
      "MiniStaff accounts are linked to one verified purchaser. Team invitations are not enabled.",
    );
  } catch (error) {
    return handleError(error);
  }
}
