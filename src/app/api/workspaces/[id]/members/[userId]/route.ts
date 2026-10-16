import { requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { account } = await requireMiniStaffAccount();
    if (!account.workspace_id || id !== account.workspace_id) {
      throw new ApiError(404, "not_found", "Workspace not found");
    }
    throw new ApiError(
      403,
      "team_membership_protected",
      "The MiniStaff purchaser membership cannot be removed from the customer dashboard. Contact support for account repair.",
    );
  } catch (error) {
    return handleError(error);
  }
}
