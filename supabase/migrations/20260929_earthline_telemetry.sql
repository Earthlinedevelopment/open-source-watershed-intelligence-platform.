-- Earthline 16874: first-party telemetry / observability store.
-- No raw addresses, exact GPS coordinates, passwords, tokens, email bodies, or report content belong here.
-- Browser clients never receive direct table access; ingestion and metrics are Edge Function owned.

create table if not exists public.earthline_telemetry_limits (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  global_daily_event_cap integer not null default 10000 check (global_daily_event_cap >= 0),
  actor_per_minute_event_cap integer not null default 120 check (actor_per_minute_event_cap >= 1),
  raw_retention_days integer not null default 30 check (raw_retention_days between 1 and 365),
  updated_at timestamptz not null default now()
);
insert into public.earthline_telemetry_limits(id) values(true)
on conflict (id) do nothing;

create table if not exists public.earthline_telemetry_global_daily (
  usage_date date primary key,
  event_count integer not null default 0 check (event_count >= 0)
);

create table if not exists public.earthline_telemetry_actor_minute (
  actor_key text not null,
  minute_start timestamptz not null,
  event_count integer not null default 0 check (event_count >= 0),
  primary key(actor_key, minute_start)
);

create table if not exists public.earthline_telemetry_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  occurred_at timestamptz not null default now(),
  event_name text not null check (char_length(event_name) between 2 and 64),
  session_key text null check (session_key is null or char_length(session_key) <= 80),
  actor_key text null check (actor_key is null or char_length(actor_key) <= 96),
  user_id uuid null references auth.users(id) on delete set null,
  page_path text null check (page_path is null or char_length(page_path) <= 240),
  mode text null check (mode is null or mode in ('regional','property','other')),
  jurisdiction text null check (jurisdiction is null or char_length(jurisdiction) <= 120),
  country_code text null check (country_code is null or char_length(country_code) <= 8),
  state_code text null check (state_code is null or char_length(state_code) <= 16),
  geo_bucket text null check (geo_bucket is null or char_length(geo_bucket) <= 40),
  build text null check (build is null or char_length(build) <= 48),
  language text null check (language is null or char_length(language) <= 24),
  timezone text null check (timezone is null or char_length(timezone) <= 80),
  referrer_host text null check (referrer_host is null or char_length(referrer_host) <= 180),
  utm_source text null check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium text null check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign text null check (utm_campaign is null or char_length(utm_campaign) <= 160),
  success boolean null,
  duration_ms double precision null check (duration_ms is null or duration_ms >= 0),
  metric_name text null check (metric_name is null or char_length(metric_name) <= 48),
  metric_value double precision null,
  error_class text null check (error_class is null or char_length(error_class) <= 80),
  sample_rate real not null default 1 check (sample_rate > 0 and sample_rate <= 1),
  device jsonb not null default '{}'::jsonb,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists earthline_telemetry_received_idx
  on public.earthline_telemetry_events(received_at desc);
create index if not exists earthline_telemetry_event_time_idx
  on public.earthline_telemetry_events(event_name, received_at desc);
create index if not exists earthline_telemetry_session_idx
  on public.earthline_telemetry_events(session_key, received_at desc)
  where session_key is not null;
create index if not exists earthline_telemetry_user_idx
  on public.earthline_telemetry_events(user_id, received_at desc)
  where user_id is not null;
create index if not exists earthline_telemetry_mode_idx
  on public.earthline_telemetry_events(mode, received_at desc)
  where mode is not null;
create index if not exists earthline_telemetry_jurisdiction_idx
  on public.earthline_telemetry_events(jurisdiction, received_at desc)
  where jurisdiction is not null;

alter table public.earthline_telemetry_limits enable row level security;
alter table public.earthline_telemetry_global_daily enable row level security;
alter table public.earthline_telemetry_actor_minute enable row level security;
alter table public.earthline_telemetry_events enable row level security;

revoke all on table public.earthline_telemetry_limits from anon, authenticated;
revoke all on table public.earthline_telemetry_global_daily from anon, authenticated;
revoke all on table public.earthline_telemetry_actor_minute from anon, authenticated;
revoke all on table public.earthline_telemetry_events from anon, authenticated;

grant select, insert, update, delete on table public.earthline_telemetry_limits to service_role;
grant select, insert, update, delete on table public.earthline_telemetry_global_daily to service_role;
grant select, insert, update, delete on table public.earthline_telemetry_actor_minute to service_role;
grant select, insert, update, delete on table public.earthline_telemetry_events to service_role;
grant usage, select on sequence public.earthline_telemetry_events_id_seq to service_role;

create or replace function public.earthline_claim_telemetry(
  p_actor_key text,
  p_event_count integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg public.earthline_telemetry_limits%rowtype;
  today date := (now() at time zone 'utc')::date;
  minute_bucket timestamptz := date_trunc('minute', now() at time zone 'utc');
  global_count integer;
  actor_count integer;
begin
  if p_actor_key is null or char_length(p_actor_key) < 8 or p_event_count < 1 or p_event_count > 30 then
    return jsonb_build_object('allowed', false, 'reason', 'invalid-batch');
  end if;

  select * into cfg from public.earthline_telemetry_limits where id = true for update;
  if not found or cfg.enabled is not true then
    return jsonb_build_object('allowed', false, 'reason', 'telemetry-disabled');
  end if;

  insert into public.earthline_telemetry_global_daily(usage_date, event_count)
  values(today, 0) on conflict (usage_date) do nothing;
  select event_count into global_count
  from public.earthline_telemetry_global_daily where usage_date = today for update;

  insert into public.earthline_telemetry_actor_minute(actor_key, minute_start, event_count)
  values(p_actor_key, minute_bucket, 0)
  on conflict (actor_key, minute_start) do nothing;
  select event_count into actor_count
  from public.earthline_telemetry_actor_minute
  where actor_key = p_actor_key and minute_start = minute_bucket for update;

  if global_count + p_event_count > cfg.global_daily_event_cap then
    return jsonb_build_object('allowed', false, 'reason', 'global-daily-cap', 'remaining', greatest(0, cfg.global_daily_event_cap - global_count));
  end if;
  if actor_count + p_event_count > cfg.actor_per_minute_event_cap then
    return jsonb_build_object('allowed', false, 'reason', 'actor-rate-cap', 'remaining', greatest(0, cfg.actor_per_minute_event_cap - actor_count));
  end if;

  update public.earthline_telemetry_global_daily
    set event_count = event_count + p_event_count where usage_date = today;
  update public.earthline_telemetry_actor_minute
    set event_count = event_count + p_event_count
    where actor_key = p_actor_key and minute_start = minute_bucket;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'allowed',
    'globalRemaining', cfg.global_daily_event_cap - global_count - p_event_count,
    'minuteRemaining', cfg.actor_per_minute_event_cap - actor_count - p_event_count
  );
exception when others then
  return jsonb_build_object('allowed', false, 'reason', 'telemetry-quota-error');
end;
$$;

revoke all on function public.earthline_claim_telemetry(text, integer) from public, anon, authenticated;
grant execute on function public.earthline_claim_telemetry(text, integer) to service_role;

create or replace function public.earthline_prune_telemetry()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  keep_days integer;
  deleted_count integer;
begin
  select raw_retention_days into keep_days from public.earthline_telemetry_limits where id = true;
  keep_days := coalesce(keep_days, 30);
  delete from public.earthline_telemetry_events
   where received_at < now() - make_interval(days => keep_days);
  get diagnostics deleted_count = row_count;
  delete from public.earthline_telemetry_actor_minute where minute_start < now() - interval '2 days';
  delete from public.earthline_telemetry_global_daily where usage_date < (now() at time zone 'utc')::date - 400;
  return deleted_count;
end;
$$;

revoke all on function public.earthline_prune_telemetry() from public, anon, authenticated;
grant execute on function public.earthline_prune_telemetry() to service_role;

create or replace function public.earthline_admin_metrics(p_hours integer default 24)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  h integer := least(24 * 30, greatest(1, coalesce(p_hours, 24)));
  since_at timestamptz;
  result jsonb;
begin
  since_at := now() - make_interval(hours => h);

  with scoped as (
    select * from public.earthline_telemetry_events where received_at >= since_at
  ),
  summary as (
    select
      count(*)::bigint as events,
      count(distinct session_key) filter (where session_key is not null)::bigint as sessions,
      count(distinct user_id) filter (where user_id is not null)::bigint as signed_in_users,
      count(*) filter (where event_name = 'page_view')::bigint as page_views,
      count(*) filter (where event_name in ('search_request','search_result','search_proxy'))::bigint as searches,
      count(*) filter (where event_name in ('search_failure','search_quota_block'))::bigint as search_failures,
      count(*) filter (where event_name in ('regional_analysis_start','property_analysis_start'))::bigint as analysis_starts,
      count(*) filter (where event_name in ('regional_analysis_success','property_analysis_success'))::bigint as analysis_successes,
      count(*) filter (where event_name in ('regional_analysis_failure','property_analysis_failure'))::bigint as analysis_failures,
      count(*) filter (where event_name in ('js_error','unhandled_rejection'))::bigint as client_errors,
      count(*) filter (where event_name = 'report_open')::bigint as report_opens,
      count(*) filter (where event_name = 'data_open')::bigint as data_opens,
      count(*) filter (where event_name = 'donate_click')::bigint as donate_clicks,
      count(*) filter (where event_name = 'merch_click')::bigint as merch_clicks,
      percentile_cont(0.5) within group (order by duration_ms) filter (where duration_ms is not null and event_name in ('regional_analysis_success','property_analysis_success')) as analysis_p50_ms,
      percentile_cont(0.95) within group (order by duration_ms) filter (where duration_ms is not null and event_name in ('regional_analysis_success','property_analysis_success')) as analysis_p95_ms
    from scoped
  ),
  by_event as (
    select coalesce(jsonb_object_agg(event_name, n order by event_name), '{}'::jsonb) as value
    from (select event_name, count(*)::bigint n from scoped group by event_name) x
  ),
  top_jurisdictions as (
    select coalesce(jsonb_agg(jsonb_build_object('name', jurisdiction, 'events', n) order by n desc), '[]'::jsonb) as value
    from (select jurisdiction, count(*)::bigint n from scoped where jurisdiction is not null group by jurisdiction order by n desc limit 20) x
  ),
  top_errors as (
    select coalesce(jsonb_agg(jsonb_build_object('error', error_class, 'events', n) order by n desc), '[]'::jsonb) as value
    from (select error_class, count(*)::bigint n from scoped where error_class is not null group by error_class order by n desc limit 20) x
  ),
  vitals as (
    select coalesce(jsonb_agg(jsonb_build_object('metric', metric_name, 'samples', n, 'average', avg_value, 'p75', p75) order by metric_name), '[]'::jsonb) as value
    from (
      select metric_name, count(*)::bigint n, avg(metric_value) avg_value,
             percentile_cont(0.75) within group (order by metric_value) p75
      from scoped where event_name = 'web_vital' and metric_name is not null and metric_value is not null
      group by metric_name
    ) x
  )
  select jsonb_build_object(
    'hours', h,
    'generatedAt', now(),
    'summary', to_jsonb(summary),
    'eventsByName', by_event.value,
    'topJurisdictions', top_jurisdictions.value,
    'topErrors', top_errors.value,
    'webVitals', vitals.value
  ) into result
  from summary, by_event, top_jurisdictions, top_errors, vitals;

  return coalesce(result, '{}'::jsonb);
end;
$$;

revoke all on function public.earthline_admin_metrics(integer) from public, anon, authenticated;
grant execute on function public.earthline_admin_metrics(integer) to service_role;
