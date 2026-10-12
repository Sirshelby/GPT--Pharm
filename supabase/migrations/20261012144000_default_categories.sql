-- A starting set of shelves for the catalogue. Rename, reorder or add to
-- these from the staff dashboard; running this again won't overwrite changes.

insert into public.product_categories (slug, name, sort_order) values
  ('pain-and-fever',           'Pain and fever',            10),
  ('cough-cold-and-flu',       'Cough, cold and flu',       20),
  ('stomach-and-digestion',    'Stomach and digestion',     30),
  ('vitamins-and-supplements', 'Vitamins and supplements',  40),
  ('mother-and-baby',          'Mother and baby',           50),
  ('skin-and-personal-care',   'Skin and personal care',    60),
  ('first-aid',                'First aid',                 70),
  ('health-devices',           'Health devices',            80)
on conflict (slug) do nothing;
