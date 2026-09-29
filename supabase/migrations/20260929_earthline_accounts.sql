-- Earthline 16873: cross-device account profile layer.
-- Authentication is Supabase Auth; this table stores the public Earthline username.

create table if not exists public.earthline_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  constraint earthline_username_format check (username ~ '^[A-Za-z0-9._-]{3,32}$')
);

alter table public.earthline_profiles enable row level security;

create policy "profiles_read_own"
on public.earthline_profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.earthline_profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.earthline_profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Username availability can be checked without exposing account email or other auth data.
create or replace function public.earthline_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists(
    select 1 from public.earthline_profiles
    where lower(username) = lower(trim(p_username))
  );
$$;

grant execute on function public.earthline_username_available(text) to anon, authenticated;
