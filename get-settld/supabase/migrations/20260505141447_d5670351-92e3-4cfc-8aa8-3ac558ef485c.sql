
create index if not exists idx_audit_log_action_created on public.audit_log (action, created_at desc);
create index if not exists idx_audit_log_created on public.audit_log (created_at desc);

-- Search audit log with filters + pagination
create or replace function public.admin_audit_search(
  p_q text default null,
  p_action text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_limit int default 50,
  p_offset int default 0
)
returns table (
  id uuid,
  user_id uuid,
  actor_email text,
  action text,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  return query
  with filtered as (
    select a.* from public.audit_log a
    where (p_from is null or a.created_at >= p_from)
      and (p_to is null or a.created_at <= p_to)
      and (p_action is null or p_action = '' or a.action like p_action || '%')
      and (
        p_q is null or p_q = '' or
        a.action ilike '%' || p_q || '%' or
        coalesce(a.actor_email,'') ilike '%' || p_q || '%' or
        coalesce(a.target_type,'') ilike '%' || p_q || '%' or
        coalesce(a.target_id,'') ilike '%' || p_q || '%'
      )
  ), counted as (
    select count(*)::bigint as total from filtered
  )
  select f.id, f.user_id, f.actor_email, f.action, f.target_type, f.target_id,
         f.metadata, f.created_at, c.total
  from filtered f cross join counted c
  order by f.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 500))
  offset greatest(0, coalesce(p_offset, 0));
end; $$;

-- Usage stats from tool.* audit events
create or replace function public.admin_usage_stats(p_days int default 30)
returns table (
  tool text,
  events bigint,
  unique_users bigint,
  avg_duration_ms numeric,
  p95_duration_ms numeric,
  last_used timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  return query
  select
    substring(a.action from 6) as tool,
    count(*)::bigint as events,
    count(distinct a.user_id)::bigint as unique_users,
    round(avg(nullif((a.metadata->>'duration_ms')::numeric, 0)), 0) as avg_duration_ms,
    round(percentile_cont(0.95) within group (order by nullif((a.metadata->>'duration_ms')::numeric, 0)), 0) as p95_duration_ms,
    max(a.created_at) as last_used
  from public.audit_log a
  where a.action like 'tool.%'
    and a.created_at >= now() - (greatest(1, least(coalesce(p_days,30), 365)) || ' days')::interval
  group by substring(a.action from 6)
  order by events desc;
end; $$;

-- Daily activity rollup
create or replace function public.admin_daily_activity(p_days int default 30)
returns table (day date, events bigint, unique_users bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;

  return query
  select date_trunc('day', a.created_at)::date as day,
         count(*)::bigint as events,
         count(distinct a.user_id)::bigint as unique_users
  from public.audit_log a
  where a.created_at >= now() - (greatest(1, least(coalesce(p_days,30), 365)) || ' days')::interval
  group by 1
  order by 1 asc;
end; $$;
