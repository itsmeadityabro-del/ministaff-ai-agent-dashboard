-- MiniStaff is a single-purchaser, server-mediated product. Browser requests must
-- go through the Next.js BFF, which resolves the verified purchase account and
-- enforces its single workspace and managed Agent37 instance. Do not let callers
-- bypass those checks via Supabase PostgREST or security-definer RPCs.
begin;

revoke all on table
  public.workspaces,
  public.memberships,
  public.invitations,
  public.agents,
  public.ministaff_accounts,
  public.leads,
  public.appointments
from PUBLIC, anon, authenticated;

grant select, insert, update, delete on table
  public.workspaces,
  public.memberships,
  public.invitations,
  public.agents,
  public.ministaff_accounts,
  public.leads,
  public.appointments
to service_role;

-- These functions were designed for use behind a server authorization check.
-- In particular, get_workspace_members accepts a workspace UUID and
-- accept_invitation accepts a caller-supplied user UUID; neither may be exposed
-- as an unrestricted public RPC.
revoke all on function public.is_workspace_member(uuid) from PUBLIC, anon, authenticated;
revoke all on function public.is_workspace_admin(uuid) from PUBLIC, anon, authenticated;
revoke all on function public.handle_new_workspace() from PUBLIC, anon, authenticated;
revoke all on function public.get_workspace_members(uuid) from PUBLIC, anon, authenticated;
revoke all on function public.get_invitation(uuid) from PUBLIC, anon, authenticated;
revoke all on function public.accept_invitation(uuid, uuid) from PUBLIC, anon, authenticated;
revoke all on function public.bootstrap_ministaff_account(text, uuid) from PUBLIC, anon, authenticated;

grant execute on function public.is_workspace_member(uuid) to service_role;
grant execute on function public.is_workspace_admin(uuid) to service_role;
grant execute on function public.get_workspace_members(uuid) to service_role;
grant execute on function public.get_invitation(uuid) to service_role;
grant execute on function public.accept_invitation(uuid, uuid) to service_role;
grant execute on function public.bootstrap_ministaff_account(text, uuid) to service_role;

commit;
