import { ApiError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ token: string }> };

export async function POST() {
  try {
    throw new ApiError(
      403,
      "team_invitations_disabled",
      "MiniStaff accounts are linked to one verified purchaser. Invitation acceptance is not enabled.",
    );
  } catch (error) {
    return handleError(error);
  }
}
