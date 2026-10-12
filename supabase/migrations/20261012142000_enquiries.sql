-- Messages sent from the contact form.
--
-- Visitors can't touch this table directly. They call submit_enquiry(),
-- which checks what they sent, slows down anyone sending too many, and
-- saves it. Staff read and update enquiries from the dashboard.

create table if not exists public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null check (char_length(full_name) between 1 and 100),
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 255),
  phone        text check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  topic        text not null default 'general'
                 check (topic in ('general', 'product', 'delivery', 'feedback', 'other')),
  product_id   uuid references public.products (id) on delete set null,
  message      text not null check (char_length(message) between 5 and 2000),
  status       text not null default 'new' check (status in ('new', 'replied', 'closed')),
  staff_notes  text check (char_length(staff_notes) <= 2000),
  handled_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists enquiries_status_created_idx on public.enquiries (status, created_at desc);
create index if not exists enquiries_email_created_idx on public.enquiries (lower(email), created_at);

drop trigger if exists enquiries_touch_updated_at on public.enquiries;
create trigger enquiries_touch_updated_at
  before update on public.enquiries
  for each row execute function public.touch_updated_at();

alter table public.enquiries enable row level security;

drop policy if exists "Staff can read enquiries" on public.enquiries;
create policy "Staff can read enquiries"
  on public.enquiries for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff can update enquiries" on public.enquiries;
create policy "Staff can update enquiries"
  on public.enquiries for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Admins can delete enquiries" on public.enquiries;
create policy "Admins can delete enquiries"
  on public.enquiries for delete
  to authenticated
  using (public.is_admin());

-- Staff can change the status and notes, never what the customer wrote.
revoke all on table public.enquiries from anon, authenticated;
grant select, delete on table public.enquiries to authenticated;
grant update (status, staff_notes, handled_by) on table public.enquiries to authenticated;


-- ---------------------------------------------------------------------------
-- submit_enquiry(): the only way in for visitors
--
-- Errors use PostgREST's "PTxxx" codes so the website gets a real HTTP
-- status back: PT400 for something wrong with the form, PT429 for too many.
-- ---------------------------------------------------------------------------

create or replace function public.submit_enquiry(
  full_name     text,
  email         text,
  message       text,
  phone         text default null,
  topic         text default 'general',
  product_slug  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name     text := btrim(regexp_replace(full_name, '\s+', ' ', 'g'));
  v_email    text := lower(btrim(email));
  v_phone    text := nullif(btrim(phone), '');
  v_message  text := btrim(message);
  v_topic    text := coalesce(nullif(btrim(topic), ''), 'general');
  v_product  uuid;
  v_id       uuid;
begin
  if v_name is null or char_length(v_name) not between 1 and 100 then
    raise exception 'Enter your name.' using errcode = 'PT400';
  end if;
  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 255 then
    raise exception 'Enter a valid email address.' using errcode = 'PT400';
  end if;
  if v_phone is not null and v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    raise exception 'Enter a valid phone number, or leave it blank.' using errcode = 'PT400';
  end if;
  if v_message is null or char_length(v_message) not between 5 and 2000 then
    raise exception 'Write a message between 5 and 2,000 characters.' using errcode = 'PT400';
  end if;
  if v_topic not in ('general', 'product', 'delivery', 'feedback', 'other') then
    v_topic := 'other';
  end if;

  -- Three messages an hour from one address is plenty for a real person.
  if (select count(*) from public.enquiries e
      where lower(e.email) = v_email and e.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'You''ve sent a few messages already. Please wait a little before sending another.'
      using errcode = 'PT429';
  end if;

  if product_slug is not null then
    select p.id into v_product from public.products p
    where p.slug = product_slug and p.is_published;
  end if;

  insert into public.enquiries (full_name, email, phone, topic, product_id, message)
  values (v_name, v_email, v_phone, v_topic, v_product, v_message)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_enquiry(text, text, text, text, text, text) from public;
grant execute on function public.submit_enquiry(text, text, text, text, text, text) to anon, authenticated;
