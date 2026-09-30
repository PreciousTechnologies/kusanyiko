// Edge Function: set-password (admin only)
// Sets a user's password via the Auth Admin API. The new password takes
// effect immediately and the previous one stops working — there is no
// way to read the current password (one-way hash), only replace it.
//
// POST { id: <profile uuid>, password: <min 6 chars> }
// -> 200 { success: true }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleOptions, json, requireAdmin } from '../_shared/auth.ts';

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
  const id = String(body.id ?? '');
  const password = String(body.password ?? '');
  if (!id) return json({ error: 'id is required' }, 400);
  if (!password || password.length < 6) {
    return json({ error: 'Password must be at least 6 characters long' }, 400);
  }

  const { data: target } = await admin.from('profiles').select('id,username').eq('id', id).maybeSingle();
  if (!target) return json({ error: 'User not found' }, 404);

  const { error: pwErr } = await admin.auth.admin.updateUserById(id, { password });
  if (pwErr) return json({ error: `Password update failed: ${pwErr.message}` }, 500);

  await admin.from('audit_logs').insert({
    user_id: callerId,
    action: 'reset_password',
    resource_type: 'user',
    resource_id: id,
    details: { target_user: (target as { username?: string }).username, via: 'admin_set' },
    ip_address: '',
    user_agent: '',
  });

  return json({ success: true }, 200);
});
