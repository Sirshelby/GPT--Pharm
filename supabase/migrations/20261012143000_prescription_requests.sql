-- Prescription and refill requests.
--
-- This is health data, which the Nigeria Data Protection Act treats as
-- "sensitive personal data", so it gets the tightest rules in the database:
--   * Visitors can upload a prescription photo into a private bucket, but
--     can't list, open, replace or delete anything in it, including their own.
--   * Requests only go in through submit_prescription_request(), which
--     checks the form, the consent box and the uploaded file.
--   * Only staff can read requests or open the photos, and every status
--     change is written to a history table so there's a record of who did what.


-- ---------------------------------------------------------------------------
-- Requests
-- ---------------------------------------------------------------------------

create table if not exists public.prescription_requests (
  id                uuid primary key default gen_random_uuid(),
  -- Short code we give the customer, e.g. RX-7KQ3MD, so they can quote it on the phone
  reference         text not null unique,
  kind              text not null check (kind in ('new', 'refill')),
  full_name         text not null check (char_length(full_name) between 1 and 100),
  phone             text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  email             text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255),
  -- What they need refilled, in their own words
  medicines         text check (char_length(medicines) <= 1000),
  -- Object name in the private "prescriptions" bucket
  file_path         text unique,
  fulfilment        text not null check (fulfilment in ('pickup', 'delivery')),
  delivery_address  text check (char_length(delivery_address) <= 300),
  notes             text check (char_length(notes) <= 1000),
  consented_at      timestamptz not null,
  status            text not null default 'received'
                      check (status in ('received', 'reviewing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  staff_notes       text check (char_length(staff_notes) <= 2000),
  assigned_to       uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint prescription_new_needs_file     check (kind = 'refill' or file_path is not null),
  constraint prescription_refill_needs_items check (kind = 'new' or medicines is not null),
  constraint prescription_delivery_address   check (fulfilment = 'pickup' or delivery_address is not null)
);

create index if not exists prescription_requests_status_created_idx
  on public.prescription_requests (status, created_at desc);
-- Phone numbers are compared on their last ten digits, so 0803 123 4567 and
-- +234 803 123 4567 count as the same phone.
create or replace function public.phone_key(phone text)
returns text
language sql
immutable
as $$ select right(regexp_replace(phone, '\D', '', 'g'), 10) $$;

drop index if exists public.prescription_requests_phone_created_idx;
create index prescription_requests_phone_created_idx
  on public.prescription_requests (public.phone_key(phone), created_at);

drop trigger if exists prescription_requests_touch_updated_at on public.prescription_requests;
create trigger prescription_requests_touch_updated_at
  before update on public.prescription_requests
  for each row execute function public.touch_updated_at();

alter table public.prescription_requests enable row level security;

drop policy if exists "Staff can read prescription requests" on public.prescription_requests;
create policy "Staff can read prescription requests"
  on public.prescription_requests for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can update prescription requests" on public.prescription_requests;
create policy "Staff can update prescription requests"
  on public.prescription_requests for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Admins can delete prescription requests" on public.prescription_requests;
create policy "Admins can delete prescription requests"
  on public.prescription_requests for delete
  to authenticated
  using (public.is_admin());

-- Staff can move a request along and add notes, but can't rewrite what the
-- customer sent.
revoke all on table public.prescription_requests from anon, authenticated;
grant select, delete on table public.prescription_requests to authenticated;
grant update (status, staff_notes, assigned_to) on table public.prescription_requests to authenticated;


-- ---------------------------------------------------------------------------
-- History: one row per status change, written automatically
-- ---------------------------------------------------------------------------

create table if not exists public.prescription_request_events (
  id          bigint generated always as identity primary key,
  request_id  uuid not null references public.prescription_requests (id) on delete cascade,
  status      text not null,
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists prescription_request_events_request_idx
  on public.prescription_request_events (request_id, created_at);

create or replace function public.log_prescription_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.prescription_request_events (request_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists prescription_requests_log_status on public.prescription_requests;
create trigger prescription_requests_log_status
  after insert or update of status on public.prescription_requests
  for each row execute function public.log_prescription_status();

alter table public.prescription_request_events enable row level security;

drop policy if exists "Staff can read request history" on public.prescription_request_events;
create policy "Staff can read request history"
  on public.prescription_request_events for select
  to authenticated
  using (public.is_staff());

revoke all on table public.prescription_request_events from anon, authenticated;
grant select on table public.prescription_request_events to authenticated;


-- ---------------------------------------------------------------------------
-- Prescription photos: a private bucket
--
-- Visitors may only add files named incoming/<random id>.<ext>. The website
-- makes up the random id, so nobody can guess another person's file name,
-- and without read access they couldn't open it anyway.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prescriptions', 'prescriptions', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "prescriptions: anyone can upload" on storage.objects;
create policy "prescriptions: anyone can upload"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'prescriptions'
    and name ~ '^incoming/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|heic|heif|pdf)$'
  );

drop policy if exists "prescriptions: staff can view" on storage.objects;
create policy "prescriptions: staff can view"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'prescriptions' and public.is_staff());

drop policy if exists "prescriptions: admins can delete" on storage.objects;
create policy "prescriptions: admins can delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'prescriptions' and public.is_admin());


-- ---------------------------------------------------------------------------
-- submit_prescription_request(): the only way in for visitors
--
-- Returns the reference code to show the customer. Errors use PostgREST's
-- "PTxxx" codes: PT400 for a problem with the form, PT429 for too many.
-- ---------------------------------------------------------------------------

create or replace function public.submit_prescription_request(
  kind              text,
  full_name         text,
  phone             text,
  fulfilment        text,
  consent           boolean,
  email             text default null,
  medicines         text default null,
  file_path         text default null,
  delivery_address  text default null,
  notes             text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- Letters and numbers that can't be confused with each other on the phone
  alphabet    constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_kind      text := lower(btrim(kind));
  v_name      text := btrim(regexp_replace(full_name, '\s+', ' ', 'g'));
  v_phone     text := btrim(phone);
  v_email     text := nullif(lower(btrim(email)), '');
  v_meds      text := nullif(btrim(medicines), '');
  v_file      text := nullif(btrim(file_path), '');
  v_fulfil    text := lower(btrim(fulfilment));
  v_address   text := nullif(btrim(delivery_address), '');
  v_notes     text := nullif(btrim(notes), '');
  v_reference text;
begin
  if consent is not true then
    raise exception 'Please confirm you''re happy for us to use these details to prepare your medicines.'
      using errcode = 'PT400';
  end if;
  if v_kind is null or v_kind not in ('new', 'refill') then
    raise exception 'Choose whether this is a new prescription or a refill.' using errcode = 'PT400';
  end if;
  if v_name is null or char_length(v_name) not between 1 and 100 then
    raise exception 'Enter your name.' using errcode = 'PT400';
  end if;
  if v_phone is null or v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    raise exception 'Enter a phone number we can call you on.' using errcode = 'PT400';
  end if;
  if v_email is not null and (v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 255) then
    raise exception 'Enter a valid email address, or leave it blank.' using errcode = 'PT400';
  end if;
  if v_fulfil is null or v_fulfil not in ('pickup', 'delivery') then
    raise exception 'Choose pickup or delivery.' using errcode = 'PT400';
  end if;
  if v_fulfil = 'delivery' and (v_address is null or char_length(v_address) > 300) then
    raise exception 'Enter the delivery address.' using errcode = 'PT400';
  end if;
  if v_meds is not null and char_length(v_meds) > 1000 then
    raise exception 'Keep the list of medicines under 1,000 characters.' using errcode = 'PT400';
  end if;
  if v_notes is not null and char_length(v_notes) > 1000 then
    raise exception 'Keep your notes under 1,000 characters.' using errcode = 'PT400';
  end if;

  if v_kind = 'refill' and v_meds is null then
    raise exception 'List the medicines you''d like refilled.' using errcode = 'PT400';
  end if;

  if v_kind = 'new' and v_file is null then
    raise exception 'Add a photo or PDF of your prescription.' using errcode = 'PT400';
  end if;

  if v_file is not null then
    -- The file must be one that was just uploaded through the website and
    -- isn't already attached to another request.
    if not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'prescriptions'
        and o.name = v_file
        and o.name like 'incoming/%'
        and o.created_at > now() - interval '2 hours'
    ) then
      raise exception 'We couldn''t find your uploaded prescription. Please add it again.'
        using errcode = 'PT400';
    end if;

    if exists (select 1 from public.prescription_requests r where r.file_path = v_file) then
      raise exception 'That prescription has already been sent.' using errcode = 'PT400';
    end if;
  end if;

  -- Five requests a day from one phone number covers a whole household.
  if (select count(*) from public.prescription_requests r
      where public.phone_key(r.phone) = public.phone_key(v_phone)
        and r.created_at > now() - interval '1 day') >= 5 then
    raise exception 'We''ve already had several requests from this number today. Please call us instead.'
      using errcode = 'PT429';
  end if;

  -- Pick an unused reference. Clashes are rare (32^6 is about a billion), so
  -- this nearly always succeeds first time.
  loop
    v_reference := 'RX-';
    for i in 1..6 loop
      v_reference := v_reference || substr(alphabet, 1 + floor(random() * 32)::int, 1);
    end loop;

    begin
      insert into public.prescription_requests
        (reference, kind, full_name, phone, email, medicines, file_path,
         fulfilment, delivery_address, notes, consented_at)
      values
        (v_reference, v_kind, v_name, v_phone, v_email, v_meds, v_file,
         v_fulfil, case when v_fulfil = 'delivery' then v_address end, v_notes, now());
      exit;
    exception when unique_violation then
      -- Only retry if it was the reference that clashed
      if sqlerrm not like '%reference%' then
        raise;
      end if;
    end;
  end loop;

  return v_reference;
end;
$$;

revoke all on function public.submit_prescription_request(text, text, text, text, boolean, text, text, text, text, text) from public;
grant execute on function public.submit_prescription_request(text, text, text, text, boolean, text, text, text, text, text) to anon, authenticated;
