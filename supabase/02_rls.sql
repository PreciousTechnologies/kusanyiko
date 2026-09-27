-- ============================================================
-- Kusanyiko → Supabase | 02_rls.sql
-- Run AFTER 01_schema.sql. Enables RLS + role-based policies that
-- mirror Django logic: admin=all, registrant=own, apostle=kanda scope.
-- ============================================================

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.export_history enable row level security;
alter table public.branding_settings enable row level security;

-- ---------- security-definer helpers (bypass RLS safely) ----------
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

create or replace function public.my_kanda()
returns text language sql stable security definer set search_path = public as $$
  select kanda from public.profiles where id = auth.uid()
$$;

-- Kanda membership test: does this member row fall inside my kanda?
create or replace function public.in_my_kanda(m_region text, m_center text, m_zone text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.kanda_areas ka
    where ka.kanda = public.my_kanda()
      and (ka.area = m_region or ka.area = m_center or ka.area = m_zone)
  )
$$;

-- ============================================================
-- PROFILES
-- ============================================================
drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Inserts come from the handle_new_user() trigger (service role bypasses RLS),
-- so no insert policy for regular users. Admins creating users go through
-- Supabase Auth Admin API + trigger; role is then set via update policy above.
drop policy if exists profiles_insert_trigger_only on public.profiles;
create policy profiles_insert_trigger_only on public.profiles
  for insert to authenticated with check (false);

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
  for delete to authenticated using (public.is_admin());

-- ============================================================
-- MEMBERS
-- list/create: registrant→own, apostle→kanda, admin→all
-- (mirrors MemberListCreateView.get_queryset + MemberDetailView)
-- ============================================================
drop policy if exists members_select_scoped on public.members;
create policy members_select_scoped on public.members
  for select to authenticated
  using (
    is_deleted = false and (
      public.is_admin()
      or created_by = auth.uid()
      or (public.my_role() = 'apostle' and public.in_my_kanda(region, center_area, zone))
    )
  );

drop policy if exists members_insert_own on public.members;
create policy members_insert_own on public.members
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists members_update_scoped on public.members;
create policy members_update_scoped on public.members
  for update to authenticated
  using (
    public.is_admin()
    or created_by = auth.uid()
    or (public.my_role() = 'apostle' and public.in_my_kanda(region, center_area, zone))
  )
  with check (
    public.is_admin()
    or created_by = auth.uid()
    or (public.my_role() = 'apostle' and public.in_my_kanda(region, center_area, zone))
  );

-- Hard delete rarely used (frontend soft-deletes via is_deleted=true).
-- Allow owner + admin; apostle cannot hard-delete.
drop policy if exists members_delete_scoped on public.members;
create policy members_delete_scoped on public.members
  for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- Public member search (Django: public_member_search AllowAny, 50 rows max).
-- Expose a LIMITED view instead of opening the whole table:
drop view if exists public.public_member_search;
create view public.public_member_search with (security_invoker = true) as
  select id, first_name, middle_name, last_name, gender, region, center_area, picture_url
  from public.members where is_deleted = false limit 50;

-- If you truly want anonymous search, uncomment below (restricted columns only).
-- For safety it stays disabled by default — frontend search page should call
-- the authenticated endpoint or an Edge Function with rate limiting.
-- grant select on public.public_member_search to anon;

-- ============================================================
-- AUDIT LOGS — insert: anyone authed; select: own + admin sees all
-- ============================================================
drop policy if exists audit_insert_any on public.audit_logs;
create policy audit_insert_any on public.audit_logs
  for insert to authenticated with check (true);

drop policy if exists audit_select_own_or_admin on public.audit_logs;
create policy audit_select_own_or_admin on public.audit_logs
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ============================================================
-- EXPORT HISTORY — own rows (+ admin sees all)
-- ============================================================
drop policy if exists exports_select_own_or_admin on public.export_history;
create policy exports_select_own_or_admin on public.export_history
  for select to authenticated
  using (created_by = auth.uid() or public.is_admin());

drop policy if exists exports_insert_own on public.export_history;
create policy exports_insert_own on public.export_history
  for insert to authenticated with check (created_by = auth.uid());

-- ============================================================
-- BRANDING — public read (landing page), admin-only write
-- ============================================================
drop policy if exists branding_public_read on public.branding_settings;
create policy branding_public_read on public.branding_settings
  for select to anon, authenticated using (true);

drop policy if exists branding_admin_write on public.branding_settings;
create policy branding_admin_write on public.branding_settings
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists branding_admin_insert on public.branding_settings;
create policy branding_admin_insert on public.branding_settings
  for insert to authenticated with check (public.is_admin());
