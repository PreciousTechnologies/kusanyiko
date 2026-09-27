-- ============================================================
-- Kusanyiko → Supabase | 04_seed.sql
-- Run AFTER 01 + 02. Seeds kanda_areas + singleton branding row.
-- ============================================================

-- ---------- KANDA → AREAS (mirrors Django KANDA_AREAS) ----------
insert into public.kanda_areas (kanda, area) values
  ('dar_es_salaam_na_pwani','Dar es Salaam'),('dar_es_salaam_na_pwani','Pwani'),
  ('dar_es_salaam_na_pwani','Mwenge'),('dar_es_salaam_na_pwani','Temeke'),
  ('dar_es_salaam_na_pwani','Ushindi'),('dar_es_salaam_na_pwani','Imara'),
  ('dar_es_salaam_na_pwani','Kinondoni'),('dar_es_salaam_na_pwani','Zanzibar'),
  ('dar_es_salaam_na_pwani','Yombo'),('dar_es_salaam_na_pwani','Kisukulu'),
  ('dar_es_salaam_na_pwani','Kisukuru'),
  ('nyanda_za_juu_kusini','Mbeya'),('nyanda_za_juu_kusini','Rukwa'),
  ('nyanda_za_juu_kusini','Katavi'),('nyanda_za_juu_kusini','Iringa'),
  ('kusini','Mtwara'),('kusini','Lindi'),('kusini','Ruvuma'),('kusini','Njombe'),
  ('kaskazini','Kilimanjaro'),('kaskazini','Arusha'),('kaskazini','Manyara'),('kaskazini','Tanga'),
  ('magharibi_na_ziwa','Kigoma'),('magharibi_na_ziwa','Shinyanga'),('magharibi_na_ziwa','Simiyu'),
  ('magharibi_na_ziwa','Mwanza'),('magharibi_na_ziwa','Geita'),('magharibi_na_ziwa','Mara'),
  ('magharibi_na_ziwa','Kagera'),('magharibi_na_ziwa','Tabora'),
  ('kati','Dodoma'),('kati','Singida')
on conflict do nothing;

-- ---------- Singleton branding row ----------
insert into public.branding_settings (id) values (1) on conflict (id) do nothing;
