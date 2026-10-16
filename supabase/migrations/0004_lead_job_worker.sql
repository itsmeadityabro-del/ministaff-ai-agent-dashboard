-- Server-side job processor support. No browser role can claim or complete jobs.
alter table public.lead_jobs
  add column if not exists result jsonb;

create index if not exists lead_jobs_due_idx
  on public.lead_jobs(available_at, created_at)
  where status = 'queued';

create or replace function public.claim_lead_jobs(p_limit integer default 5)
returns setof public.lead_jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Recover abandoned leases. The worker also applies exponential backoff to explicit errors.
  update public.lead_jobs
  set status = 'failed',
      locked_at = null,
      last_error = coalesce(last_error, 'Processing lease expired after maximum attempts'),
      updated_at = now()
  where status = 'processing'
    and locked_at is not null
    and locked_at < now() - interval '10 minutes'
    and attempt_count >= 5;

  update public.lead_jobs
  set status = 'queued',
      locked_at = null,
      available_at = now(),
      last_error = coalesce(last_error, 'Processing lease expired; retrying'),
      updated_at = now()
  where status = 'processing'
    and locked_at is not null
    and locked_at < now() - interval '10 minutes'
    and attempt_count < 5;

  return query
  with candidates as (
    select j.id
    from public.lead_jobs as j
    where j.status = 'queued'
      and j.available_at <= now()
    order by j.available_at asc, j.created_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 5), 10))
  )
  update public.lead_jobs as j
  set status = 'processing',
      locked_at = now(),
      attempt_count = j.attempt_count + 1,
      updated_at = now()
  from candidates as c
  where j.id = c.id
  returning j.*;
end;
$$;

revoke all on function public.claim_lead_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_lead_jobs(integer) to service_role;
