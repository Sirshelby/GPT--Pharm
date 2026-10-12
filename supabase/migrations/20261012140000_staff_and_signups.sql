-- Staff accounts, shared helpers and the opening-list sign-ups.
--
-- How access works across the whole database:
--   * Visitors (the "anon" role) can only do the handful of things the public
--     site needs: read published products, join the opening list, and submit
--     enquiries and prescription requests through the functions further on.
--   * Logged-in users can see and change things only if they're listed in
--     staff_members. Turning off public sign-ups in Supabase Auth means the
--     only people who can log in at all are staff you've invited.
--   * Admins can additionally delete records and manage the staff list.


-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------

create table if not exists public.staff_members (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 1 and 100),
  role        text not null default 'staff' check (role in ('staff', 'pharmacist', 'admin')),
  created_at  timestamptz not null default now()
);

comment on table public.staff_members is
  'People who can log in to the staff dashboard. Add a row here after inviting someone in Supabase Auth.';

alter table public.staff_members enable row level security;

-- These two run with the owner's rights so policies can call them without
-- needing read access to staff_members themselves.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.staff_members where user_id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.staff_members where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_staff(), public.is_admin() from public;
grant execute on function public.is_staff(), public.is_admin() to anon, authenticated;

drop policy if exists "Staff can see the team" on public.staff_members;
create policy "Staff can see the team"
  on public.staff_members for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Admins manage the team" on public.staff_members;
create policy "Admins manage the team"
  on public.staff_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.staff_members from anon, authenticated;
grant select, insert, update, delete on table public.staff_members to authenticated;


-- ---------------------------------------------------------------------------
-- Shared trigger: keep updated_at honest
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- Opening-list sign-ups
--
-- This table may already exist (the first version of the site created it),
-- so everything here is written to be safe to run on top of it.
-- ---------------------------------------------------------------------------

create table if not exists public.signups (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

-- One sign-up per email. The website relies on this: a second attempt fails
-- with a "duplicate" error, which it treats as success.
create unique index if not exists signups_email_unique on public.signups (lower(email));

alter table public.signups drop constraint if exists signups_full_name_length;
alter table public.signups add constraint signups_full_name_length
  check (char_length(full_name) between 1 and 100) not valid;

alter table public.signups drop constraint if exists signups_email_format;
alter table public.signups add constraint signups_email_format
  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255) not valid;

alter table public.signups enable row level security;

drop policy if exists "Anyone can join the opening list" on public.signups;
create policy "Anyone can join the opening list"
  on public.signups for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Staff can see the opening list" on public.signups;
create policy "Staff can see the opening list"
  on public.signups for select
  to authenticated
  using (public.is_staff());

-- Needed for "delete my details" requests under the data protection act
drop policy if exists "Admins can remove sign-ups" on public.signups;
create policy "Admins can remove sign-ups"
  on public.signups for delete
  to authenticated
  using (public.is_admin());

-- Visitors may add a row but never read the list back.
revoke all on table public.signups from anon, authenticated;
grant insert (full_name, email) on table public.signups to anon, authenticated;
grant select, delete on table public.signups to authenticated;
