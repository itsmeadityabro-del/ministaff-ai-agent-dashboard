-- Workspace-scoped MiniStaff leads and appointment records.
-- Access is server-side through requireMember/requireAdmin in the Next.js API.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  company text,
  email text,
  phone text,
  source text not null default 'manual',
  status text not null default 'new' check (status in ('new', 'qualified', 'contacted', 'booked', 'lost')),
  temperature text not null default 'warm' check (temperature in ('hot', 'warm', 'cold')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists leads_workspace_created_idx on public.leads(workspace_id, created_at desc);
create index if not exists leads_workspace_status_idx on public.leads(workspace_id, status);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  title text not null check (char_length(title) between 1 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_valid_window check (ends_at > starts_at)
);
create index if not exists appointments_workspace_start_idx on public.appointments(workspace_id, starts_at);
create index if not exists appointments_workspace_status_idx on public.appointments(workspace_id, status);

alter table public.leads enable row level security;
alter table public.appointments enable row level security;
revoke all on public.leads from anon, authenticated;
revoke all on public.appointments from anon, authenticated;
