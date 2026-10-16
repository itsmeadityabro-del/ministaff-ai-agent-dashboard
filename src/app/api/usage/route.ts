import { agent37 } from "@/lib/agent37";
import { requireMiniStaffAccount } from "@/lib/auth";
import { ApiError, handleError, json } from "@/lib/http";

export async function GET() {
  try {
    const { account } = await requireMiniStaffAccount();
    const [budget, usage, agent] = await Promise.all([
      agent37.getBudget(account.agent37_id),
      agent37.getUsage(account.agent37_id),
      agent37.getAgent(account.agent37_id),
    ]);
    const llm = usage.by_integration?.llm;
    return json({
      plan: account.plan,
      entitlement_status: account.entitlement_status,
      agent: { id: agent.id, status: agent.status, past_due: agent.past_due },
      budget,
      usage: {
        ...usage,
        llm_input_tokens: llm?.input_tokens ?? 0,
        llm_output_tokens: llm?.output_tokens ?? 0,
        llm_calls: llm?.calls ?? 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
