-- Example products for LOCAL development only (`npx supabase db reset`).
-- They're not added to the live database. Prices are left empty on purpose,
-- so nothing here can be mistaken for a real price.

insert into public.products (slug, name, category_id, description, pack_size, in_stock, is_published)
select v.slug, v.name, c.id, v.description, v.pack_size, v.in_stock, true
from (values
  ('paracetamol-500mg',  'Paracetamol 500mg tablets', 'pain-and-fever',
     'For mild to moderate pain and fever. Ask a pharmacist about the right dose for children.', 'Pack of 16', true),
  ('oral-rehydration-salts', 'Oral rehydration salts', 'stomach-and-digestion',
     'Replaces fluids and salts lost through diarrhoea or vomiting.', 'Box of 10 sachets', true),
  ('vitamin-c-1000mg', 'Vitamin C 1000mg', 'vitamins-and-supplements',
     'Effervescent vitamin C tablets.', 'Tube of 20', true),
  ('digital-bp-monitor', 'Digital blood pressure monitor', 'health-devices',
     'Upper-arm monitor for checking your blood pressure at home. We''ll show you how to use it.', null, false)
) as v(slug, name, category, description, pack_size, in_stock)
join public.product_categories c on c.slug = v.category
on conflict (slug) do nothing;
