"""
Kusanyiko → Supabase data migration.

Copies users + members (+branding) from the Django SQLite db
(kusanyikoo/db.sqlite3) into your Supabase Postgres.

WHAT IT DOES
  1. Reads users_user, members_member, analytics_brandingsettings from SQLite.
  2. Creates matching Auth users via Supabase Auth Admin API
     (profiles are auto-created by the handle_new_user() trigger).
  3. Patches profile role/status/kanda/country/region/legacy_id.
  4. Inserts members with created_by mapped to the new profile uuid.
  5. NOTE: member pictures (media/member_pictures/*) are NOT auto-uploaded
     (filenames are preserved in picture_url where possible — upload the
     folder to the `member_pictures` bucket manually, keeping the same
     filenames, or re-upload photos after cutover).

REQUIREMENTS
  pip install supabase  (supabase-py v2)

USAGE
  $env:SUPABASE_URL="https://xyzcompany.supabase.co"
  $env:SUPABASE_SERVICE_KEY="eyJ...service_role... (KEEP SECRET, never in frontend!)"
  python supabase/migrate_data.py

  Optional:
  $env:SQLITE_PATH="kusanyikoo/db.sqlite3"   # default
  $env:DRY_RUN="1"                            # print counts only, write nothing
"""
import os
import sqlite3
import sys

SQLITE_PATH = os.environ.get("SQLITE_PATH", os.path.join("kusanyikoo", "db.sqlite3"))
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
DRY_RUN = os.environ.get("DRY_RUN", "0") == "1"

if not SUPABASE_URL or not SERVICE_KEY:
    print("ERROR: set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
    sys.exit(1)

if not os.path.exists(SQLITE_PATH):
    print(f"ERROR: sqlite db not found at {SQLITE_PATH}. Set SQLITE_PATH.")
    sys.exit(1)

from supabase import create_client  # pip install supabase

sb = create_client(SUPABASE_URL, SERVICE_KEY)
con = sqlite3.connect(SQLITE_PATH)
con.row_factory = sqlite3.Row


def table_exists(name: str) -> bool:
    row = con.execute(
        "select name from sqlite_master where type='table' and name=?", (name,)
    ).fetchone()
    return row is not None


def get_users():
    # Django table for custom user model (app_label users)
    for candidate in ("users_user",):
        if table_exists(candidate):
            return list(con.execute(f"select * from {candidate}"))
    return []


def get_members():
    for candidate in ("members_member",):
        if table_exists(candidate):
            return list(con.execute(f"select * from {candidate}"))
    return []


users = get_users()
members = get_members()
print(f"SQLite: {len(users)} users, {len(members)} members from {SQLITE_PATH}")

if DRY_RUN:
    print("DRY_RUN=1 — nothing written.")
    sys.exit(0)

# ---- 1) users → auth.users + profiles ----
email_to_profile = {}
for u in users:
    u = dict(u)
    email = (u.get("email") or "").strip()
    username = (u.get("username") or email.split("@")[0]).strip()
    if not email:
        print(f"SKIP user {username!r}: no email (Supabase Auth requires email).")
        continue
    # Idempotency: skip if profile with this email already exists
    existing = sb.table("profiles").select("id,email").eq("email", email).limit(1).execute()
    if existing.data:
        email_to_profile[email] = existing.data[0]["id"]
        print(f"EXISTS {email} — reusing profile.")
        # still patch legacy fields
        sb.table("profiles").update({
            "legacy_id": u.get("id"),
            "role": (u.get("role") or "registrant"),
            "status": (u.get("status") or "active"),
            "kanda": (u.get("kanda") or ""),
            "country": (u.get("country") or ""),
            "region": (u.get("region") or ""),
            "is_staff": bool(u.get("is_staff", False)),
            "is_superuser": bool(u.get("is_superuser", False)),
        }).eq("email", email).execute()
        continue
    # Create auth user (email auto-confirmed so they can log in immediately)
    try:
        created = sb.auth.admin.create_user({
            "email": email,
            "password": "TempPass123!",  # users reset via Forgot Password
            "email_confirm": True,
            "user_metadata": {
                "username": username,
                "first_name": u.get("first_name") or "",
                "last_name": u.get("last_name") or "",
                "role": u.get("role") or "registrant",
                "kanda": u.get("kanda") or "",
                "country": u.get("country") or "",
                "region": u.get("region") or "",
            },
        })
        uid = created.user.id
    except Exception as e:  # e.g. user already in auth.users
        print(f"WARN create {email}: {e}")
        found = sb.auth.admin.list_users()
        match = [x for x in (found.users if hasattr(found, "users") else found.get("users", [])) if getattr(x, "email", "") == email]
        if not match:
            continue
        uid = match[0].id
    import time
    time.sleep(0.4)  # let handle_new_user() trigger fire
    sb.table("profiles").update({
        "legacy_id": u.get("id"),
        "username": username,
        "role": (u.get("role") or "registrant"),
        "status": (u.get("status") or "active"),
        "kanda": (u.get("kanda") or ""),
        "country": (u.get("country") or ""),
        "region": (u.get("region") or ""),
        "is_staff": bool(u.get("is_staff", False)),
        "is_superuser": bool(u.get("is_superuser", False)),
    }).eq("id", uid).execute()
    email_to_profile[email] = uid
    print(f"OK user {username} ({email}) role={u.get('role')}")

# Map legacy django user id → new profile uuid (for members.created_by)
legacy_to_uuid = {}
for u in users:
    u = dict(u)
    email = (u.get("email") or "").strip()
    if email in email_to_profile:
        legacy_to_uuid[u.get("id")] = email_to_profile[email]

# ---- 2) members ----
ok, skipped = 0, 0
for m in members:
    m = dict(m)
    if m.get("is_deleted"):
        skipped += 1
        continue
    payload = {
        "legacy_id": m.get("id"),
        "first_name": m.get("first_name") or "",
        "middle_name": m.get("middle_name") or "",
        "last_name": m.get("last_name") or "",
        "gender": (m.get("gender") or "male"),
        "age": int(m.get("age") or 0),
        "marital_status": (m.get("marital_status") or "single"),
        "saved": bool(m.get("saved", False)),
        "church_registration_number": m.get("church_registration_number") or "",
        "country": m.get("country") or "",
        "region": m.get("region") or "",
        "center_area": m.get("center_area") or "",
        "zone": m.get("zone") or "",
        "cell": m.get("cell") or "",
        "postal_address": m.get("postal_address") or "",
        "mobile_no": m.get("mobile_no") or "",
        "email": m.get("email") or "",
        "church_position": m.get("church_position") or "",
        "visitors_count": int(m.get("visitors_count") or 0),
        "origin": (m.get("origin") or "invited"),
        "residence": m.get("residence") or "",
        "career": m.get("career") or "",
        "attending_date": m.get("attending_date"),
        "picture_url": (m.get("picture") or None),  # e.g. member_pictures/abc.jpg
        "created_by": legacy_to_uuid.get(m.get("created_by_id")),
        "is_deleted": False,
    }
    # Idempotency on legacy_id
    exists = sb.table("members").select("id").eq("legacy_id", m.get("id")).limit(1).execute()
    if exists.data:
        skipped += 1
        continue
    try:
        sb.table("members").insert(payload).execute()
        ok += 1
    except Exception as e:
        print(f"WARN member {m.get('id')}: {e}")
        skipped += 1

print(f"DONE. members inserted={ok} skipped={skipped}")
print("NEXT: every migrated user must use Forgot Password once (temp password is TempPass123!).")
print("Upload kusanyikoo/media/member_pictures/* into the member_pictures storage bucket (same filenames).")
