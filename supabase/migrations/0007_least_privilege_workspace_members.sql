-- Support least-privilege workspace members. Invitations now default to the
-- member role; admins must explicitly create an administrator invitation.
ALTER TABLE public.memberships
  DROP CONSTRAINT IF EXISTS memberships_role_check;
ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('admin', 'member'));

ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;
ALTER TABLE public.invitations
  ADD CONSTRAINT invitations_role_check
  CHECK (role IN ('admin', 'member'));

-- Consume invitation tokens once, preserve an existing membership's role on conflict,
-- and prevent a link from silently downgrading an existing administrator.
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid, p_user uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'user is required' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_inv
  FROM public.invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found';
  END IF;
  IF v_inv.expires_at < now() THEN
    RAISE EXCEPTION 'invitation expired';
  END IF;

  INSERT INTO public.memberships (workspace_id, user_id, role)
  VALUES (v_inv.workspace_id, p_user, v_inv.role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  DELETE FROM public.invitations WHERE token = p_token;
  RETURN v_inv.workspace_id;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.accept_invitation(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(uuid, uuid) TO service_role;
