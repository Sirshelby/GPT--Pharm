-- The product catalogue shown on /products.
--
-- It's a browse-and-ask catalogue, not a shop: there's no basket or payment.
-- Selling medicines online in Nigeria needs separate approval from the
-- Pharmacy Council, and that can be added later.


-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

create table if not exists public.product_categories (
  id          smallint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 60),
  sort_order  smallint not null default 0
);

alter table public.product_categories enable row level security;

drop policy if exists "Anyone can see categories" on public.product_categories;
create policy "Anyone can see categories"
  on public.product_categories for select
  to anon, authenticated
  using (true);

drop policy if exists "Staff manage categories" on public.product_categories;
create policy "Staff manage categories"
  on public.product_categories for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

revoke all on table public.product_categories from anon, authenticated;
grant select on table public.product_categories to anon, authenticated;
grant insert, update, delete on table public.product_categories to authenticated;


-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text not null unique
                           check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name                   text not null check (char_length(name) between 2 and 120),
  category_id            smallint references public.product_categories (id) on delete set null,
  description            text check (char_length(description) <= 2000),
  pack_size              text check (char_length(pack_size) <= 60),
  -- In naira. Leave empty to show "Ask for price".
  price                  numeric(12, 2) check (price is null or price >= 0),
  requires_prescription  boolean not null default false,
  in_stock               boolean not null default true,
  is_published           boolean not null default false,
  -- Path of the photo in the public "product-images" storage bucket
  image_path             text check (char_length(image_path) <= 200),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  -- Nigerian rules don't allow prescription-only medicines to be advertised
  -- to the public, so they can be recorded here but never published.
  constraint products_no_published_pom check (not (is_published and requires_prescription))
);

create index if not exists products_published_category_idx
  on public.products (is_published, category_id, name);

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

drop policy if exists "Anyone can see published products" on public.products;
create policy "Anyone can see published products"
  on public.products for select
  to anon, authenticated
  using (is_published or public.is_staff());

drop policy if exists "Staff add products" on public.products;
create policy "Staff add products"
  on public.products for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "Staff edit products" on public.products;
create policy "Staff edit products"
  on public.products for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

drop policy if exists "Staff remove products" on public.products;
create policy "Staff remove products"
  on public.products for delete
  to authenticated
  using (public.is_staff());

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;


-- ---------------------------------------------------------------------------
-- Product photos: a public bucket, so the site can show them without
-- signing every URL. Only staff can add or change them.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product-images: staff upload" on storage.objects;
create policy "product-images: staff upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "product-images: staff replace" on storage.objects;
create policy "product-images: staff replace"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

drop policy if exists "product-images: staff remove" on storage.objects;
create policy "product-images: staff remove"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff());

-- Uploading with "upsert" needs to be able to see the existing file.
drop policy if exists "product-images: staff list" on storage.objects;
create policy "product-images: staff list"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and public.is_staff());
