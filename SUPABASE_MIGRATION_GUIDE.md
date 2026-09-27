# Kusanyiko → Supabase Migration Guide

Everything is prepared. Follow these steps in order — ~30–45 min total.
Your Django backend stays untouched until the final cutover step.

## What was built for you

| File | Purpose |
|---|---|
| `supabase/01_schema.sql` | Tables: `profiles`, `kanda_areas`, `members`, `audit_logs`, `export_history`, `branding_settings` + auto-profile trigger |
| `supabase/02_rls.sql` | Row Level Security mirroring Django roles (admin=all, registrant=own, apostle=kanda) |
| `supabase/03_storage.sql` | `member_pictures` bucket + policies (replaces Django `media/`) |
| `supabase/04_seed.sql` | Kanda→area mapping + singleton branding row |
| `supabase/migrate_data.py` | Copies users + members from `kusanyikoo/db.sqlite3` to Supabase |
| `frontend/src/lib/supabaseClient.ts` | Supabase client (reads `.env`) |
| `frontend/src/services/supabaseApi.ts` | Drop-in replacement for `services/api.ts` — same export names, all pages/slices keep working |
| `frontend/src/utils/exportHelpers.ts` | Client-side CSV/Excel/PDF (replaces Django openpyxl/reportlab) |
| `frontend/.env.example` | Env template |
| `frontend/package.json` | Added `@supabase/supabase-js`, `xlsx`, `jspdf`, `jspdf-autotable` |

---

## STEP 1 — Create the Supabase project (10 min)

1. Go to https://supabase.com → New Project.
2. Name: `kusanyiko`, choose region closest to Tanzania (e.g. EU West / Singapore), set a strong DB password, wait ~2 min.
3. Open **Project Settings → API** and copy:
   - `Project URL` → `REACT_APP_SUPABASE_URL`
   - `anon public` key → `REACT_APP_SUPABASE_ANON_KEY`
   - `service_role` key → needed once for data migration (NEVER put in frontend).

## STEP 2 — Run the SQL files in order (5 min)

Supabase Dashboard → **SQL Editor** → New Query → paste each file, Run:

1. `supabase/01_schema.sql` → must say success (creates tables + trigger).
2. `supabase/02_rls.sql` → enables RLS + policies.
3. `supabase/03_storage.sql` → creates bucket. If you get a permission error on `storage.buckets`, instead create the bucket manually in **Storage → New Bucket** named `member_pictures`, set **Public**, then re-run the file (policies only).
4. `supabase/04_seed.sql` → seeds kanda areas + branding.

Verify in **Table Editor**: you should see `profiles`, `members`, `audit_logs`, `export_history`, `branding_settings`, `kanda_areas`.

## STEP 3 — Configure Auth (3 min)

1. **Authentication → Sign In / Providers → Email**: enabled.
2. **IMPORTANT — disable email confirmation** (else signup/login breaks until users click email links):
   **Authentication → Settings →** turn OFF *"Confirm email"* (or set *"Allow new users to sign up without confirming email"*).
   You can re-enable it later once SMTP is configured.
3. **Authentication → URL Configuration**:
   - Site URL: your frontend URL (e.g. `https://kusanyiko.efathamedia.com` or `http://localhost:3000` for testing).
   - Redirect URLs: add `http://localhost:3000/**`, `https://kusanyiko.efathamedia.com/**`, `https://*.onrender.com/**`.

## STEP 4 — Create your admin user (2 min)

1. **Authentication → Users → Add User → Create new user**: enter YOUR email + password, check **Auto Confirm**.
2. Copy the new user's UUID, then in **SQL Editor** run:
   ```sql
   update public.profiles set role='admin', status='active', is_staff=true, is_superuser=true
   where email='you@example.com';
   ```

## STEP 5 — Migrate old data (optional, 10 min)

Only if you have existing Django data to keep:

```powershell
pip install supabase
$env:SUPABASE_URL="https://xyzcompany.supabase.co"
$env:SUPABASE_SERVICE_KEY="paste-service-role-key"
$env:DRY_RUN="1"
python supabase/migrate_data.py   # dry run — checks counts only
$env:DRY_RUN="0"
python supabase/migrate_data.py   # real run
```

- Rerunning is safe (idempotent on email / legacy_id).
- Migrated users get temp password `TempPass123!` — each must use **Forgot Password** once.
- Photos: upload `kusanyikoo/media/member_pictures/*` into the `member_pictures` bucket keeping filenames.

## STEP 6 — Point the frontend at Supabase (5 min)

```powershell
cd frontend
copy .env.example .env   # then edit .env with your real URL + anon key
npm install              # installs @supabase/supabase-js, xlsx, jspdf
```

**Cutover** (one command, reversible — Django file is kept as backup):

```powershell
# from repo root
Move-Item frontend\src\services\api.ts frontend\src\services\api.django-legacy.ts
Copy-Item frontend\src\services\supabaseApi.ts frontend\src\services\api.ts
cd frontend
npm start
```

All 11 files importing `services/api` keep working — same names, same shapes.
To roll back: delete `api.ts`, rename `api.django-legacy.ts` back.

## STEP 7 — Verify (5 min)

Log in as admin and check:

- [ ] Login works (email + password; username also works — resolved to email).
- [ ] Admin dashboard numbers match Django.
- [ ] Add Member with photo → photo displays (storage upload works).
- [ ] Registrant account sees ONLY its own members.
- [ ] Apostle account sees ONLY its kanda members.
- [ ] Export Data → CSV + Excel + PDF all download.
- [ ] User Management → create / status change / delete works.
- [ ] Landing page branding loads (public read policy).

## STEP 8 — Decommission Django (after 1–2 weeks parallel run)

1. Frontend: delete `frontend/src/services/api.django-legacy.ts`, remove `REACT_APP_API_URL`.
2. Render: point frontend static site env to Supabase vars; stop/suspend the Django web service + Postgres when confident.
3. Keep `kusanyikoo/` folder in git for history (or archive to a branch).

---

## Behavior changes to know (vs Django)

| Area | Django | Supabase now |
|---|---|---|
| User IDs | integers | UUIDs (opaque — UI treats as opaque, safe) |
| Login | username OR email | same UX (username resolved to email behind the scenes); Auth is email-based |
| Token refresh | manual interceptor | automatic via supabase client |
| Failed-login lockout | 5 tries → 30 min lock | Supabase rate-limits auth; `status=suspended` still blocks login manually |
| Admin password reset | temp password shown | reset LINK emailed instead (no service key in browser by design) |
| Admin create user | stayed logged in | session restored automatically in code; if it ever swaps, just log back in |
| Exports | server openpyxl/reportlab | identical UX, generated in browser (xlsx/jspdf); logged to `export_history` |
| Financial export | fake sample rows | same sample rows (no model existed — carry over, don't treat as real) |
| Public member search | open endpoint | authenticated + RLS-scoped (safer); open only deliberately via Edge Function if needed |
| Audit log | IP captured server-side | IP blank (browser can't know it), user-agent kept |
| `stats/` Django app | dead code | dropped (was never installed) |
| Old bug fixed | `role` endpoint rejected `registrant`/`apostle` | roles work correctly now |

## Troubleshooting

- **"Supabase env missing"** → `frontend/.env` wrong filename or vars misspelled (must start `REACT_APP_`).
- **Login says "Invalid credentials" right after signup** → email confirmation still ON. Turn it off (Step 3) or confirm via email.
- **Empty members for admin** → you ran seed but are logged in as registrant; promote to admin (Step 4).
- **Photos don't upload** → bucket missing or storage policies not applied; redo Step 2.3.
- **Excel downloads as CSV** → run `npm install xlsx` (fallback is intentional until installed).
- **PDF downloads as CSV** → run `npm install jspdf jspdf-autotable`.
- **RLS error "new row violates row-level security"** on member create → `created_by` must equal your auth uid (handled automatically — don't override it).
- **Need old backend back NOW** → reverse the Step 6 rename, `npm start`. Nothing was deleted.
