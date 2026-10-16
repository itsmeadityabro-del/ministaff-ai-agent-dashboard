import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/http";
import type { AgentRow, Role } from "@/lib/types";

// `db` is the privileged service-role client (RLS bypassed). All table access in this app goes
// through it, which makes the helpers below the authorization boundary — they replace what RLS used
// to enforce. The user's IDENTITY still comes only from their verified session cookie (the
// anon/SSR client in getSession), never from `db`; `db` is used purely to run the query once the
// session-derived user id has been checked against the memberships table.
export type DB = ReturnType<typeof createAdminClient>;

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user };
}

export async function requireUser() {
  const { user } = await getSession();
  if (!user) throw new ApiError(401, "unauthorized", "Sign in required");
  return { db: createAdminClient(), user };
}

export async function getRole(db: DB, workspaceId: string, userId: string): Promise<Role | null> {
  const { data } = await db
    .from("memberships")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

// 404 (not 403) so we don't leak whether the workspace exists.
export async function requireMember(db: DB, workspaceId: string, userId: string): Promise<Role> {
  const role = await getRole(db, workspaceId, userId);
  if (!role) throw new ApiError(404, "not_found", "Workspace not found");
  return role;
}

export async function requireAdmin(db: DB, workspaceId: string, userId: string): Promise<void> {
  const role = await getRole(db, workspaceId, userId);
  if (role !== "admin") throw new ApiError(403, "forbidden", "Admin role required");
}

export async function getAgentRow(db: DB, agent37Id: string): Promise<AgentRow> {
  const { data } = await db.from("agents").select("*").eq("agent37_id", agent37Id).maybeSingle();
  if (!data) throw new ApiError(404, "not_found", "Agent not found");
  return data as AgentRow;
}

// The auth + ownership preamble every per-agent BFF route repeats: require a signed-in user,
// resolve the agent's mirror row, then gate on the workspace role — "member" for reads, "admin"
// for mutations. Returns the privileged client, user, and row so the handler can get on with its
// work (and run its DB writes through `db`).
export async function requireMiniStaffAccount() {
  const { db, user } = await requireUser();
  const email = user.email?.trim().toLowerCase();
  if (!email || !user.email_confirmed_at) {
    throw new ApiError(403, "account_unavailable", "A verified MiniStaff purchase email is required");
  }
  const { data, error } = await db
    .from("ministaff_accounts")
    .select("email, user_id, agent37_id, workspace_id, plan, entitlement_status")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new ApiError(500, "db_error", error.message);
  if (!data || data.entitlement_status !== "active") {
    throw new ApiError(403, "account_unavailable", "No active MiniStaff account is linked to this email");
  }
  if (data.user_id && data.user_id !== user.id) {
    throw new ApiError(403, "account_unavailable", "This MiniStaff account is linked to another login");
  }
  return { db, user, account: data };
}

export async function requireAgentAccess(agent37Id: string, _access: "member" | "admin" = "member") {
  const { db, user, account } = await requireMiniStaffAccount();
  if (account.agent37_id !== agent37Id || !account.workspace_id) {
    throw new ApiError(404, "not_found", "Agent not found");
  }
  const row = await getAgentRow(db, account.agent37_id);
  if (row.workspace_id !== account.workspace_id) {
    throw new ApiError(404, "not_found", "Agent not found");
  }
  await requireMember(db, row.workspace_id, user.id);
  return { db, user, row, account };
}
