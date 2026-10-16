-- Make first-workspace onboarding safe under simultaneous first requests.
-- Multiple requests can observe zero memberships at the same time; this transaction-scoped
-- advisory lock serializes bootstrap attempts for one session-verified user.
CREATE OR REPLACE FUNCTION public.ensure_default_workspace(p_user uuid)
RETURNS TABLE(id uuid, name text, owner_id uuid, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_workspace public.workspaces%ROWTYPE;
BEGIN
  IF p_user IS NULL THEN
    RAISE EXCEPTION 'user is required' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  SELECT w.*
  INTO v_workspace
  FROM public.memberships AS m
  JOIN public.workspaces AS w ON w.id = m.workspace_id
  WHERE m.user_id = p_user
  ORDER BY w.created_at ASC, w.id ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT v_workspace.id, v_workspace.name, v_workspace.owner_id, v_workspace.created_at;
    RETURN;
  END IF;

  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', p_user)
  RETURNING * INTO v_workspace;

  -- The workspace-created trigger normally inserts this membership. Upsert also makes the
  -- function resilient to trigger changes and confirms the ownership edge in the same transaction.
  INSERT INTO public.memberships (workspace_id, user_id, role)
  VALUES (v_workspace.id, p_user, 'admin')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN QUERY SELECT v_workspace.id, v_workspace.name, v_workspace.owner_id, v_workspace.created_at;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.ensure_default_workspace(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_default_workspace(uuid) TO service_role;
