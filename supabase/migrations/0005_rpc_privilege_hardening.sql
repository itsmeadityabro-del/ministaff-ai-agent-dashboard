-- Lock down SECURITY DEFINER routines used by the BFF.
--
-- PostgreSQL grants EXECUTE on newly created functions to PUBLIC unless those defaults are
-- explicitly changed. A GRANT to service_role alone does not remove that PUBLIC grant.
-- The browser roles have no direct table grants by design; all privileged access must go through
-- the application server, which verifies the caller and workspace membership before using admin DB.
--
-- In particular, accept_invitation(p_token, p_user) trusts p_user because the server passes the
-- authenticated session ID under service_role (auth.uid() is NULL there). If browser roles can call
-- it directly, they could try to add arbitrary user IDs to a workspace. These RPCs must be service-only.

REVOKE ALL PRIVILEGES ON FUNCTION public.is_workspace_member(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.is_workspace_admin(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.handle_new_workspace()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_workspace() TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_workspace_members(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_members(uuid) TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.get_invitation(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation(uuid) TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.accept_invitation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid, uuid) TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.ingest_lead_event(uuid, text, text, text, text, text, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ingest_lead_event(uuid, text, text, text, text, text, text, text, text)
  TO service_role;

REVOKE ALL PRIVILEGES ON FUNCTION public.claim_lead_jobs(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead_jobs(integer) TO service_role;
