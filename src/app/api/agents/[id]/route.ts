import { requireAgentAccess } from "@/lib/auth";
import { ApiError, handleError, json, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { db } = await requireAgentAccess(id, "admin");

    const { name } = await readJson<{ name?: string }>(request);
    const trimmed = (name || "").trim();
    if (!trimmed) throw new ApiError(400, "invalid_request", "name is required");

    const { error } = await db.from("agents").update({ name: trimmed }).eq("agent37_id", id);
    if (error) throw new ApiError(500, "db_error", error.message);

    return json({ id, name: trimmed });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    // MiniStaff subscriptions own one provisioned Agent37 instance. Deleting it
    // from the customer-facing dashboard could orphan a paid subscription and
    // cannot be undone from this UI; account repair/deprovisioning stays an
    // explicit support operation.
    await requireAgentAccess(id, "admin");
    throw new ApiError(
      403,
      "managed_agent_protected",
      "The managed MiniStaff staffer cannot be deleted from the customer dashboard. Contact support for account repair.",
    );
  } catch (e) {
    return handleError(e);
  }
}
