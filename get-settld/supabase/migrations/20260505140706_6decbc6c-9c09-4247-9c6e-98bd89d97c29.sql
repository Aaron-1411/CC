
-- 1. AUDIT LOG TABLE -------------------------------------------------------
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,                       -- actor (nullable for anon/system events)
  actor_email  text,
  action       text not null,              -- e.g. 'invite.sent', 'report.viewed', 'plan.changed'
  target_type  text,                       -- e.g. 'scenario', 'property', 'user'
  target_id    text,
  metadata     jsonb not null default '{}'::jsonb,
  ip           text,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_user_id    on public.audit_log (user_id);
create index if not exists idx_audit_log_action     on public.audit_log (action);

alter table public.audit_log enable row level security;

-- Admins can read everything.
create policy "Admins read all audit"
  on public.audit_log for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Users can read their own audit entries (transparency).
create policy "Users read own audit"
  on public.audit_log for select
  to authenticated
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies — table is append-only via SECURITY DEFINER fn.

-- 2. LOG_ACTION (controlled write) -----------------------------------------
create or replace function public.log_action(
  p_action      text,
  p_target_type text default null,
  p_target_id   text default null,
  p_metadata    jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  if p_action is null or length(p_action) = 0 or length(p_action) > 100 then
    raise exception 'invalid action';
  end if;

  v_email := coalesce(auth.jwt() ->> 'email', '');

  insert into public.audit_log (user_id, actor_email, action, target_type, target_id, metadata)
  values (auth.uid(), v_email, p_action, p_target_type, p_target_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end; $$;

revoke execute on function public.log_action(text, text, text, jsonb) from public;
grant execute on function public.log_action(text, text, text, jsonb) to authenticated;

-- 3. BOOTSTRAP ADMIN -------------------------------------------------------
-- One-shot: while no admin exists, the signed-in caller can claim 'admin' by
-- providing the correct password. After the first admin is set, the password
-- no longer works and only existing admins can grant the role.
create or replace function public.bootstrap_admin(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_admin_exists boolean;
begin
  if v_uid is null then
    raise exception 'auth required';
  end if;
  if p_password is null or p_password <> 'Admin1@' then
    -- Log the failed attempt for traceability.
    insert into public.audit_log (user_id, actor_email, action, metadata)
    values (v_uid, coalesce(auth.jwt() ->> 'email', ''), 'admin.bootstrap.failed', jsonb_build_object('reason','bad_password'));
    return false;
  end if;

  select exists(select 1 from public.user_roles where role = 'admin') into v_admin_exists;
  if v_admin_exists then
    insert into public.audit_log (user_id, actor_email, action, metadata)
    values (v_uid, coalesce(auth.jwt() ->> 'email', ''), 'admin.bootstrap.failed', jsonb_build_object('reason','admin_exists'));
    return false;
  end if;

  insert into public.user_roles (user_id, role) values (v_uid, 'admin')
    on conflict (user_id, role) do nothing;

  insert into public.audit_log (user_id, actor_email, action, metadata)
  values (v_uid, coalesce(auth.jwt() ->> 'email', ''), 'admin.bootstrap.success', '{}'::jsonb);

  return true;
end; $$;

revoke execute on function public.bootstrap_admin(text) from public;
grant execute on function public.bootstrap_admin(text) to authenticated;

-- 4. ADMIN: LIST USERS ------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  role app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  saved_properties_count bigint,
  saved_scenarios_count bigint,
  mip_assessments_count bigint,
  price_alerts_count bigint
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
    u.id,
    u.email::text,
    coalesce((select ur.role from public.user_roles ur where ur.user_id = u.id order by
      case ur.role when 'admin' then 1 when 'pro' then 2 else 3 end
      limit 1), 'free'::app_role) as role,
    u.created_at,
    u.last_sign_in_at,
    (select count(*) from public.saved_properties sp where sp.user_id = u.id),
    (select count(*) from public.saved_scenarios ss where ss.user_id = u.id),
    (select count(*) from public.mip_assessments ma where ma.user_id = u.id),
    (select count(*) from public.price_alerts pa where pa.user_id = u.id)
  from auth.users u
  order by u.created_at desc;
end; $$;

revoke execute on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- 5. ADMIN: RECENT AUDIT ----------------------------------------------------
create or replace function public.admin_recent_audit(p_limit int default 200)
returns setof public.audit_log
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  return query
    select * from public.audit_log
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 200), 1000));
end; $$;

revoke execute on function public.admin_recent_audit(int) from public;
grant execute on function public.admin_recent_audit(int) to authenticated;

-- 6. ADMIN: CHANGE A USER'S ROLE -------------------------------------------
create or replace function public.admin_set_role(p_user_id uuid, p_role app_role)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'forbidden';
  end if;
  if p_user_id is null or p_role is null then
    raise exception 'invalid args';
  end if;

  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role);

  insert into public.audit_log (user_id, actor_email, action, target_type, target_id, metadata)
  values (auth.uid(), coalesce(auth.jwt() ->> 'email',''), 'admin.role.changed', 'user', p_user_id::text,
          jsonb_build_object('new_role', p_role));
  return true;
end; $$;

revoke execute on function public.admin_set_role(uuid, app_role) from public;
grant execute on function public.admin_set_role(uuid, app_role) to authenticated;
