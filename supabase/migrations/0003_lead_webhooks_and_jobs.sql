-- Secure inbound lead webhook credentials and durable queued processing.
create table if not exists public.lead_webhook_keys (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.lead_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'awaiting_review', 'completed', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);
create index if not exists lead_jobs_queue_idx on public.lead_jobs(status, available_at, created_at);
create index if not exists lead_jobs_workspace_idx on public.lead_jobs(workspace_id, created_at desc);

alter table public.lead_webhook_keys enable row level security;
alter table public.lead_jobs enable row level security;
revoke all on public.lead_webhook_keys from anon, authenticated;
revoke all on public.lead_jobs from anon, authenticated;

-- The function checks the hashed webhook key and inserts the lead + queue item in one transaction.
-- It serializes events per workspace on the key row so retries with the same idempotency key cannot
-- create duplicate leads, even if two requests arrive simultaneously.
create or replace function public.ingest_lead_event(
  p_workspace_id uuid,
  p_secret_hash text,
  p_name text,
  p_company text default null,
  p_email text default null,
  p_phone text default null,
  p_source text default 'website',
  p_temperature text default 'warm',
  p_idempotency_key text default null
)
returns table (lead_id uuid, job_id uuid, duplicate boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stored_hash text;
  v_lead_id uuid;
  v_job_id uuid;
  v_event_key text;
begin
  if p_name is null or char_length(btrim(p_name)) < 1 or char_length(btrim(p_name)) > 160 then
    raise exception 'invalid lead name' using errcode = '22023';
  end if;
  if p_secret_hash is null or p_secret_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid webhook secret' using errcode = '42501';
  end if;

  select k.token_hash into v_stored_hash
  from public.lead_webhook_keys k
  where k.workspace_id = p_workspace_id
  for update;

  if not found or v_stored_hash is distinct from p_secret_hash then
    raise exception 'invalid webhook secret' using errcode = '42501';
  end if;

  update public.lead_webhook_keys
  set last_used_at = now()
  where workspace_id = p_workspace_id;

  if p_idempotency_key is not null and char_length(p_idempotency_key) > 200 then
    raise exception 'idempotency key too long' using errcode = '22023';
  end if;
  v_event_key := coalesce(nullif(btrim(p_idempotency_key), ''), 'evt_' || gen_random_uuid()::text);

  if p_idempotency_key is not null then
    select j.lead_id, j.id into v_lead_id, v_job_id
    from public.lead_jobs j
    where j.workspace_id = p_workspace_id and j.idempotency_key = v_event_key;
    if found then
      return query select v_lead_id, v_job_id, true;
      return;
    end if;
  end if;

  insert into public.leads (
    workspace_id, name, company, email, phone, source, status, temperature
  ) values (
    p_workspace_id, btrim(p_name), nullif(btrim(p_company), ''),
    nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''),
    coalesce(nullif(btrim(p_source), ''), 'website'),
    'new',
    case when p_temperature in ('hot', 'warm', 'cold') then p_temperature else 'warm' end
  ) returning id into v_lead_id;

  insert into public.lead_jobs (workspace_id, lead_id, idempotency_key, status)
  values (p_workspace_id, v_lead_id, v_event_key, 'queued')
  returning id into v_job_id;

  return query select v_lead_id, v_job_id, false;
end;
$$;

revoke all on function public.ingest_lead_event(uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.ingest_lead_event(uuid, text, text, text, text, text, text, text, text) to service_role;
