import { agent37 } from "@/lib/agent37";
import { requireAgentAccess } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";
import { resolveUsageMonth } from "@/lib/usage-period";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await requireAgentAccess(id, "member");

    const period = resolveUsageMonth(new URL(request.url).searchParams.get("month"));
    if (!period.ok) throw new ApiError(400, period.code, period.message);

    return json(await agent37.getUsage(id, period.month));
  } catch (e) {
    return handleError(e);
  }
}
