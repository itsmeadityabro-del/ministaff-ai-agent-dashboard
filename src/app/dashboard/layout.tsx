import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import type { WorkspaceWithRole } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  if (!user) redirect("/login");
  if (!user.email || !user.email_confirmed_at) redirect("/login?error=account");

  const db = createAdminClient();
  const { data, error } = await db.rpc("bootstrap_ministaff_account", {
    p_email: user.email.trim().toLowerCase(),
    p_user: user.id,
  });
  const account = Array.isArray(data) ? data[0] : data;
  if (error || !account?.workspace_id) redirect("/login?error=account");

  const { data: workspace, error: workspaceError } = await db
    .from("workspaces")
    .select("*")
    .eq("id", account.workspace_id)
    .maybeSingle();
  if (workspaceError || !workspace) redirect("/login?error=account");

  const workspaces: WorkspaceWithRole[] = [{ ...workspace, role: "admin" }];
  return (
    <WorkspaceProvider initialWorkspaces={workspaces} userEmail={user.email}>
      {children}
    </WorkspaceProvider>
  );
}
