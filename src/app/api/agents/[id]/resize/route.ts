import { requireAgentAccess } from "@/lib/auth";
import { ApiError, handleError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await requireAgentAccess(id, "admin");
    // Instance size changes alter provider compute costs. Until product tiers define
    // and enforce separate compute shapes, only the activation/billing lifecycle may
    // resize a managed instance; customers cannot create unplanned wallet spend.
    throw new ApiError(
      403,
      "managed_agent_resize_disabled",
      "MiniStaff manages instance size as part of your subscription. Contact support for a capacity change.",
    );
  } catch (error) {
    return handleError(error);
  }
}
