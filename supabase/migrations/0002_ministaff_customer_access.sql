create table if not exists public.ministaff_accounts (
  email text primary key check (email = lower(trim(email))),
  user_id uuid unique references auth.users (id) on delete set null,
  agent37_id text not null unique,
  workspace_id uuid unique references public.workspaces (id) on delete set null,
  plan text not null check (plan in ('plus', 'pro', 'max')),
  entitlement_status text not null default 'pending' check (entitlement_status in ('pending', 'active', 'inactive', 'review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ministaff_accounts enable row level security;
revoke all on public.ministaff_accounts from anon, authenticated;
grant select, insert, update, delete on public.ministaff_accounts to service_role;
grant select, insert, update, delete on public.workspaces, public.memberships, public.agents to service_role;

create or replace function public.bootstrap_ministaff_account(p_email text, p_user uuid)
returns table (workspace_id uuid, agent37_id text, plan text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.ministaff_accounts%rowtype;
  v_workspace public.workspaces%rowtype;
begin
  select * into v_account
  from public.ministaff_accounts
  where email = lower(trim(p_email))
  for update;

  if not found or v_account.entitlement_status <> 'active' then
    raise exception 'MiniStaff account is not active';
  end if;
  if v_account.user_id is not null and v_account.user_id <> p_user then
    raise exception 'MiniStaff account is already linked';
  end if;

  update public.ministaff_accounts
  set user_id = p_user, updated_at = now()
  where email = v_account.email;

  if v_account.workspace_id is null then
    insert into public.workspaces (name, owner_id)
    values ('My MiniStaff desk', p_user)
    returning * into v_workspace;

    insert into public.memberships (workspace_id, user_id, role)
    values (v_workspace.id, p_user, 'admin')
    on conflict do nothing;

    insert into public.agents (agent37_id, workspace_id, name, status, template, created_by)
    values (v_account.agent37_id, v_workspace.id, 'My MiniStaff staffer', 'provisioning', 'agent37-hermes-small', p_user)
    on conflict (agent37_id) do nothing;

    update public.ministaff_accounts
    set workspace_id = v_workspace.id, updated_at = now()
    where email = v_account.email;
    v_account.workspace_id := v_workspace.id;
  else
    insert into public.memberships (workspace_id, user_id, role)
    values (v_account.workspace_id, p_user, 'admin')
    on conflict do nothing;
  end if;

  return query select v_account.workspace_id, v_account.agent37_id, v_account.plan;
end;
$$;

revoke all on function public.bootstrap_ministaff_account(text, uuid) from public, anon, authenticated;
grant execute on function public.bootstrap_ministaff_account(text, uuid) to service_role;
