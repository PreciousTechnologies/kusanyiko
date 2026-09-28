# Kusanyiko Edge Functions (admin user management)

Browser-side `auth.signUp` must NOT be used to create users: it swaps the
admin's session, races the profile trigger (406), and hits Supabase Auth
signup rate limits. These functions use the **service role + Auth Admin API**
instead. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
are injected automatically — no secrets to configure.

| Function | Purpose |
|---|---|
| `create-user` | Create auth user (email pre-confirmed) + upsert profile row. Reuses the auth row if the email is already registered. |
| `delete-user` | Soft-delete members, delete profile row AND auth row. Prevents self-delete. |

Both verify the caller's JWT and require `profiles.role = 'admin'`.

## Deploy (one time, from this repo root)

```powershell
npm install -g supabase
supabase login
supabase link --project-ref qjkzzeowihdnmezbwyxd
supabase functions deploy create-user
supabase functions deploy delete-user
```

Verify in Dashboard → Edge Functions that both are listed, then create a
test user from the app's User Management page. The frontend calls the
functions first and falls back to the legacy browser flow only if they
are missing (you'll see no fallback once deployed).

## Local test (optional)

```powershell
supabase functions serve create-user --env-file ./supabase/.env.local
```
