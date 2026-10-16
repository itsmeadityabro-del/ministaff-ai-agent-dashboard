import { requireAdmin, requireMember, requireUser } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; userId: string }> };

async function isOwner(
  db: Awaited<ReturnType<typeof requireUser>>["db"],
  workspaceId: string,
  userId: string
) {
  const { data, error } = await db
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw new ApiError(500, "db_error", "Unable to verify workspace ownership");
  return data?.owner_id === userId;
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id, userId } = await params;
    const { db, user } = await requireUser();

    // A caller may leave their own workspace, but must still be a member of that workspace.
    // Removing someone else requires admin rights; requireAdmin returns 404 for non-members.
    if (userId === user.id) {
      await requireMember(db, id, user.id);
    } else {
      await requireAdmin(db, id, user.id);
    }

    if (await isOwner(db, id, userId)) {
      throw new ApiError(400, "invalid_request", "The workspace owner cannot be removed");
    }

    const { data: removed, error } = await db
      .from("memberships")
      .delete()
      .eq("workspace_id", id)
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();
    if (error) throw new ApiError(500, "db_error", "Workspace membership could not be removed");
    if (!removed) throw new ApiError(404, "not_found", "Workspace member not found");

    return json({ user_id: userId, removed: true });
  } catch (e) {
    return handleError(e);
  }
}
