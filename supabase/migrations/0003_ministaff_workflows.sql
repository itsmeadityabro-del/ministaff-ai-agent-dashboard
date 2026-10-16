-- Workspace-scoped MiniStaff lead and appointment records. The dashboard BFF uses a
-- server-only Supabase service-role client after checking the verified account entitlement.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  email text,
  phone text,
  company text,
  source text not null default 'manual',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_workspace_created_idx on public.leads(workspace_id, created_at desc);
create index if not exists leads_workspace_status_idx on public.leads(workspace_id, status);

create extension if not exists btree_gist;
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  timezone text not null default 'UTC',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_workspace_starts_idx on public.appointments(workspace_id, starts_at);
create index if not exists appointments_workspace_status_idx on public.appointments(workspace_id, status);

-- Database constraint closes the race between simultaneous booking requests.
-- Cancelled/completed records may overlap; scheduled appointments may not.
alter table public.appointments drop constraint if exists appointments_no_scheduled_overlap;
alter table public.appointments add constraint appointments_no_scheduled_overlap
  exclude using gist (
    workspace_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status = 'scheduled');

alter table public.leads enable row level security;
alter table public.appointments enable row level security;
revoke all on public.leads, public.appointments from anon, authenticated;
grant select, insert, update, delete on public.leads, public.appointments to service_role;
