// Edge Function: create-user (admin only)
// Creates an Auth user via the Admin API (no public-signup rate limits,
// no session swap) and upserts the public.profiles row directly
// (service role bypasses RLS — no trigger race).
//
// POST { email, password, username, first_name?, last_name?, role?,
//        kanda?, country?, region?, status?, is_staff?, is_superuser? }
// -> 200 { user: <profile row> }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleOptions, json, requireAdmin } from '../_shared/auth.ts';

const VALID_ROLES = ['admin', 'registrant', 'apostle', 'member'];

serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;
  const { admin, callerId } = ctx;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const username = String(body.username ?? '').trim();
  const first_name = String(body.first_name ?? '');
  const last_name = String(body.last_name ?? '');
  const role = String(body.role ?? 'registrant');
  const kanda = String(body.kanda ?? '');
  const country = String(body.country ?? '');
  const region = String(body.region ?? '');
  const status = String(body.status ?? 'active');
  const is_staff = body.is_staff ?? role === 'admin';
  const is_superuser = body.is_superuser ?? false;

  if (!email || !password || !username) {
    return json({ error: 'email, password and username are required' }, 400);
  }
  if (!VALID_ROLES.includes(role)) return json({ error: 'Invalid role' }, 400);
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return json({ error: 'Invalid status' }, 400);
  }

  // 1) Create (or reuse) the auth user. Reuse covers re-creating an email
  // whose auth row survived a legacy browser-side delete.
  let userId: string | null = null;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, first_name, last_name, role, kanda, country, region },
  });
  if (createErr) {
    if (/already (been )?registered|already exists/i.test(createErr.message ?? '')) {
      const { data: listed, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) return json({ error: `User exists but could not be resolved: ${listErr.message}` }, 500);
      const match = (listed?.users ?? []).find(
        (u: { email?: string }) => (u.email ?? '').toLowerCase() === email.toLowerCase(),
      );
      if (!match) return json({ error: 'Email is already registered' }, 409);
      userId = (match as { id: string }).id;
    } else {
      return json({ error: createErr.message }, 400);
    }
  } else {
    userId = created.user.id;
  }

  // 2) Upsert the profile row directly (upsert also repairs rows the
  // handle_new_user() trigger may have already created from metadata).
  const { data: saved, error: upErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: userId,
        email,
        username,
        first_name,
        last_name,
        role,
        status,
        kanda,
        country,
        region,
        is_staff: Boolean(is_staff),
        is_superuser: Boolean(is_superuser),
      },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (upErr) return json({ error: `Profile write failed: ${upErr.message}` }, 500);

  // 3) Audit (best-effort)
  await admin.from('audit_logs').insert({
    user_id: callerId,
    action: 'create',
    resource_type: 'user',
    resource_id: String(userId),
    details: { created_user: username, via: 'edge-function' },
    ip_address: '',
    user_agent: '',
  });

  return json({ user: saved }, 200);
});
