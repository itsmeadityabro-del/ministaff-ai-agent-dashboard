import { requireAdmin, requireMember, requireUser } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";
import type { Invitation, WorkspaceMember } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user } = await requireUser();
    const role = await requireMember(db, id, user.id);

    const { data: members, error } = await db.rpc("get_workspace_members", { p_workspace: id });
    if (error) throw new ApiError(500, "db_error", error.message);

    let invitations: Invitation[] = [];
    if (role === "admin") {
      const { data: inv, error: invitationError } = await db
        .from("invitations")
        .select("*")
        .eq("workspace_id", id)
        .order("created_at", { ascending: false });
      if (invitationError) throw new ApiError(500, "db_error", "Unable to load workspace invitations");
      invitations = (inv as Invitation[]) ?? [];
    }

    return json({ members: (members as WorkspaceMember[]) ?? [], invitations, role });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db, user } = await requireUser();
    await requireAdmin(db, id, user.id);

    const body = await readJson<{ role?: string }>(request, 4096);
    const inviteRole = body.role ?? "member";
    if (inviteRole !== "member" && inviteRole !== "admin") {
      throw new ApiError(400, "invalid_request", "Invitation role must be member or admin");
    }

    const { data, error } = await db
      .from("invitations")
      .insert({ workspace_id: id, role: inviteRole, created_by: user.id })
      .select("token")
      .single();
    if (error) throw new ApiError(500, "db_error", error.message);

    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    const url = `${origin}/invite/${data.token}`;

    return json({ token: data.token, url }, 201);
  } catch (e) {
    return handleError(e);
  }
}
