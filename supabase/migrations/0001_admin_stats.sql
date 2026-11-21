-- Private Admin Stats Schema & Strict AAL2 RLS
-- Run this migration in Supabase SQL Editor or via `supabase db push`.

create table if not exists public.admin_config (
  id integer primary key check (id = 1),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;
revoke all on table public.admin_config from anon, authenticated, public;

create table if not exists public.release_snapshots (
  snapshot_date date not null default ((now() at time zone 'utc')::date),
  release_tag text not null,
  asset_name text not null,
  asset_ext text not null check (asset_ext in ('.exe', '.msi')),
  download_count bigint not null check (download_count >= 0),
  fetched_at timestamptz not null default now(),
  primary key (snapshot_date, release_tag, asset_name)
);

alter table public.release_snapshots enable row level security;
revoke all on table public.release_snapshots from anon, public;
grant select on table public.release_snapshots to authenticated;

-- Helper function evaluating signed JWT claims (Owner UUID + AAL2 + password + totp)
create or replace function public.is_verified_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.admin_config cfg
      where cfg.id = 1
        and cfg.owner_user_id = auth.uid()
    )
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (
      select 1
      from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry
      where entry ->> 'method' = 'password'
    )
    and exists (
      select 1
      from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as entry
      where entry ->> 'method' = 'totp'
    );
$$;

revoke all on function public.is_verified_admin() from public;
grant execute on function public.is_verified_admin() to authenticated;

drop policy if exists "Verified owner can read release snapshots" on public.release_snapshots;
create policy "Verified owner can read release snapshots"
  on public.release_snapshots
  for select
  to authenticated
  using (public.is_verified_admin());
