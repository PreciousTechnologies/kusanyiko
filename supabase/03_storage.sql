-- ============================================================
-- Kusanyiko → Supabase | 03_storage.sql
-- Bucket: member_pictures (replaces Django MEDIA/member_pictures/)
-- Run AFTER 01_schema.sql in SQL Editor.
-- NOTE: create the bucket in Dashboard → Storage if it doesn't exist,
-- then run this for policies. Or run the insert below via service role.
-- ============================================================

-- Create bucket (idempotent). Requires storage schema access.
insert into storage.buckets (id, name, public)
values ('member_pictures', 'member_pictures', true)
on conflict (id) do update set public = true;

-- Public read (member photos shown across dashboards + search)
drop policy if exists mp_public_read on storage.objects;
create policy mp_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'member_pictures');

-- Authenticated upload (path convention: <user_id>/<uuid>.<ext>)
drop policy if exists mp_auth_insert on storage.objects;
create policy mp_auth_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'member_pictures');

-- Owner/admin update + delete
drop policy if exists mp_auth_update on storage.objects;
create policy mp_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'member_pictures');

drop policy if exists mp_auth_delete on storage.objects;
create policy mp_auth_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'member_pictures');
