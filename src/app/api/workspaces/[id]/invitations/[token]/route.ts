import { requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; token: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }
    throw new ApiError(
      403,
      "team_invitations_disabled",
      "MiniStaff does not support customer-managed team invitations.",
    );
  } catch (error) {
    return handleError(error);
  }
}
