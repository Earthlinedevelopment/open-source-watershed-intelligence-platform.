-- Earthline 16873: authoritative server-side search limits.
-- Apply inside the connected Earthline Supabase project only.

create table if not exists public.earthline_search_limits (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  global_daily_cap integer not null default 500 check (global_daily_cap >= 0),
  guest_daily_cap integer not null default 5 check (guest_daily_cap >= 0),
  account_daily_cap integer not null default 25 check (account_daily_cap >= 0),
  per_minute_cap integer not null default 6 check (per_minute_cap >= 1),
  updated_at timestamptz not null default now()
);
insert into public.earthline_search_limits(id) values(true)
on conflict (id) do nothing;

create table if not exists public.earthline_search_global_daily (
  usage_date date primary key,
  request_count integer not null default 0 check (request_count >= 0)
);

create table if not exists public.earthline_search_actor_daily (
  actor_key text not null,
  usage_date date not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key(actor_key, usage_date)
);

create table if not exists public.earthline_search_actor_minute (
  actor_key text not null,
  minute_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  primary key(actor_key, minute_start)
);

alter table public.earthline_search_limits enable row level security;
alter table public.earthline_search_global_daily enable row level security;
alter table public.earthline_search_actor_daily enable row level security;
alter table public.earthline_search_actor_minute enable row level security;

-- No direct browser policies are created. All counters are private and are
-- touched only by the Edge Function/service role through this SECURITY DEFINER RPC.
create or replace function public.earthline_claim_search(
  p_actor_key text,
  p_is_account boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.earthline_search_limits%rowtype;
  today date := (now() at time zone 'utc')::date;
  minute_bucket timestamptz := date_trunc('minute', now() at time zone 'utc');
  global_count integer;
  actor_daily integer;
  actor_minute integer;
  actor_cap integer;
begin
  if p_actor_key is null or length(p_actor_key) < 8 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid-actor');
  end if;

  select * into cfg from public.earthline_search_limits where id = true for update;
  if not found or cfg.enabled is not true then
    return jsonb_build_object('allowed', false, 'reason', 'breaker-disabled');
  end if;

  insert into public.earthline_search_global_daily(usage_date, request_count)
  values(today, 0) on conflict (usage_date) do nothing;
  select request_count into global_count
  from public.earthline_search_global_daily where usage_date = today for update;

  actor_cap := case when p_is_account then cfg.account_daily_cap else cfg.guest_daily_cap end;

  insert into public.earthline_search_actor_daily(actor_key, usage_date, request_count)
  values(p_actor_key, today, 0) on conflict (actor_key, usage_date) do nothing;
  select request_count into actor_daily
  from public.earthline_search_actor_daily
  where actor_key = p_actor_key and usage_date = today for update;

  insert into public.earthline_search_actor_minute(actor_key, minute_start, request_count)
  values(p_actor_key, minute_bucket, 0) on conflict (actor_key, minute_start) do nothing;
  select request_count into actor_minute
  from public.earthline_search_actor_minute
  where actor_key = p_actor_key and minute_start = minute_bucket for update;

  if global_count >= cfg.global_daily_cap then
    return jsonb_build_object('allowed', false, 'reason', 'global-daily-cap', 'globalRemaining', 0);
  end if;
  if actor_daily >= actor_cap then
    return jsonb_build_object('allowed', false, 'reason', 'actor-daily-cap', 'actorRemaining', 0);
  end if;
  if actor_minute >= cfg.per_minute_cap then
    return jsonb_build_object('allowed', false, 'reason', 'rate-limit');
  end if;

  update public.earthline_search_global_daily
    set request_count = request_count + 1 where usage_date = today;
  update public.earthline_search_actor_daily
    set request_count = request_count + 1
    where actor_key = p_actor_key and usage_date = today;
  update public.earthline_search_actor_minute
    set request_count = request_count + 1
    where actor_key = p_actor_key and minute_start = minute_bucket;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'globalRemaining', cfg.global_daily_cap - global_count - 1,
    'actorRemaining', actor_cap - actor_daily - 1,
    'minuteRemaining', cfg.per_minute_cap - actor_minute - 1
  );
exception when others then
  -- Fail closed on any database error.
  return jsonb_build_object('allowed', false, 'reason', 'quota-error');
end;
$$;

revoke all on function public.earthline_claim_search(text, boolean) from public, anon, authenticated;
grant execute on function public.earthline_claim_search(text, boolean) to service_role;
