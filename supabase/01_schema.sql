-- ============================================================
-- Kusanyiko → Supabase | 01_schema.sql
-- Run FIRST in Supabase Dashboard → SQL Editor (or `supabase db push`)
-- Maps Django models: users.User, members.Member,
-- users.AuditLog, analytics.ExportHistory, analytics.BrandingSettings
-- ============================================================

-- Required extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- 1) PROFILES (replaces users.User; auth lives in auth.users)
-- id = auth.users.id (uuid). Keep legacy django id for migration.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_id integer unique,
  username text unique not null,
  email text unique not null,
  first_name text default '',
  last_name text default '',
  role text not null default 'registrant'
    check (role in ('admin','registrant','apostle','member')),
  status text not null default 'active'
    check (status in ('active','inactive','suspended')),
  kanda text default '' ,
  country text default '',
  region text default '',
  is_staff boolean not null default false,
  is_superuser boolean not null default false,
  date_joined timestamptz not null default now(),
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_status on public.profiles(status);
create index if not exists idx_profiles_username_trgm on public.profiles using gin (username gin_trgm_ops);
create index if not exists idx_profiles_email_trgm on public.profiles using gin (email gin_trgm_ops);

-- Auto-create profile when a new auth.users row appears.
-- Frontend signup passes username/role/etc via user_metadata; we copy them here.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, first_name, last_name, role, kanda, country, region)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name',''),
    coalesce(new.raw_user_meta_data->>'last_name',''),
    coalesce(new.raw_user_meta_data->>'role','registrant'),
    coalesce(new.raw_user_meta_data->>'kanda',''),
    coalesce(new.raw_user_meta_data->>'country',''),
    coalesce(new.raw_user_meta_data->>'region','')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2) KANDA_AREAS lookup (replaces KANDA_AREAS dict in Django)
-- ============================================================
create table if not exists public.kanda_areas (
  kanda text not null,
  area text not null,
  primary key (kanda, area)
);

-- ============================================================
-- 3) MEMBERS (replaces members.Member)
-- ============================================================
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  legacy_id integer unique,
  first_name text not null,
  middle_name text default '',
  last_name text not null,
  gender text not null check (gender in ('male','female')),
  age integer not null check (age >= 0 and age <= 150),
  marital_status text not null check (marital_status in ('single','married','divorced','widowed')),
  saved boolean not null default false,
  church_registration_number text default '',
  country text not null default '',
  region text default '',
  center_area text default '',
  zone text not null default '',
  cell text not null default '',
  postal_address text default '',
  mobile_no text not null default '',
  email text default '',
  church_position text default '',
  visitors_count integer not null default 0,
  origin text not null default 'invited' check (origin in ('invited','efatha')),
  residence text not null default '',
  career text default '',
  attending_date date,
  picture_url text,                       -- public URL or storage path in member_pictures bucket
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_deleted boolean not null default false
);

drop trigger if exists trg_members_updated on public.members;
create trigger trg_members_updated
  before update on public.members
  for each row execute function public.set_updated_at();

create index if not exists idx_members_created_by on public.members(created_by);
create index if not exists idx_members_not_deleted on public.members(is_deleted, created_at desc);
create index if not exists idx_members_region on public.members(region);
create index if not exists idx_members_center_area on public.members(center_area);
create index if not exists idx_members_zone on public.members(zone);
create index if not exists idx_members_gender on public.members(gender);
create index if not exists idx_members_search on public.members
  using gin ((first_name || ' ' || coalesce(middle_name,'') || ' ' || last_name || ' ' || mobile_no || ' ' || coalesce(email,'')) gin_trgm_ops);

-- ============================================================
-- 4) AUDIT LOGS (replaces users.AuditLog)
-- ============================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null
    check (action in ('create','read','update','delete','login','logout','failed_login','password_reset','auto_login','unlock_account','reset_password')),
  resource_type text not null default '',
  resource_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  ip_address text default '',
  user_agent text default '',
  timestamp timestamptz not null default now()
);

create index if not exists idx_audit_user_time on public.audit_logs(user_id, timestamp desc);
create index if not exists idx_audit_action_time on public.audit_logs(action, timestamp desc);
create index if not exists idx_audit_resource_time on public.audit_logs(resource_type, timestamp desc);

-- ============================================================
-- 5) EXPORT HISTORY (replaces analytics.ExportHistory)
-- ============================================================
create table if not exists public.export_history (
  id uuid primary key default gen_random_uuid(),
  export_type text not null check (export_type in ('members','analytics','users','financial')),
  format text not null check (format in ('csv','excel','pdf')),
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  file_size text default '',
  download_count integer not null default 0,
  filters_applied jsonb not null default '{}'::jsonb
);

create index if not exists idx_export_owner_time on public.export_history(created_by, created_at desc);
create index if not exists idx_export_type_time on public.export_history(export_type, created_at desc);

-- ============================================================
-- 6) BRANDING SETTINGS (singleton row id=1)
-- ============================================================
create table if not exists public.branding_settings (
  id integer primary key,
  app_name text not null default 'Efatha Leaders'' Camp',
  app_subtitle text not null default 'EFATHA Leaders'' Camp Registration • Kibaha',
  landing_header_title text not null default 'Efatha Leaders'' Camp',
  landing_header_subtitle text not null default 'Kibaha Leadership Registration Portal',
  landing_hero_prefix text not null default 'Welcome to',
  landing_hero_highlight text not null default 'Efatha Leaders'' Camp',
  landing_hero_suffix text not null default 'Registration',
  landing_description text not null default 'Register church leaders for the Kibaha camp where spiritual services are ministered by Apostle and Prophet Josephat Elias Mwingira at Precious Centre, Kibaha.',
  ministry_lead text not null default 'Apostle and Prophet Josephat Elias Mwingira',
  camp_location text not null default 'Precious Centre, Kibaha',
  camp_start_date text not null default 'October 6, 2025',
  camp_end_date text not null default 'October 12, 2025',
  registration_status_label text not null default 'Camp Registration Active',
  admin_dashboard_subtitle text not null default 'EFATHA Leaders'' Camp Dashboard',
  registrant_dashboard_subtitle text not null default 'EFATHA Leaders'' Camp • Your registration dashboard',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_branding_updated on public.branding_settings;
create trigger trg_branding_updated
  before update on public.branding_settings
  for each row execute function public.set_updated_at();
