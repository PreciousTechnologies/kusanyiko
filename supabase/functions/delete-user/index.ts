// Edge Function: delete-user (admin only)
// Fully removes a user: soft-deletes their members, deletes the profile
// row AND the auth.users row (via Admin API). The old browser-side delete
// left orphan auth rows behind, so re-creating the same email failed.
//
// POST { id: <profile uuid> } -> 200 { success: true }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { authenticate, handleOptions, json } from '../_shared/auth.ts';

serve(async (req: Request) => {
  const opt = handleOptions(req);
  if (opt) return opt;
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const ctx = await authenticate(req);
  if (ctx instanceof Response) return ctx;
  const { admin, callerId } = ctx;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const id = String(body.id ?? '');
  if (!id) return json({ error: 'id is required' }, 400);

  const isSelf = id === callerId;
  if (!isSelf) {
    // Deleting someone else requires the admin role; anyone may delete self.
    const { data: me } = await admin.from('profiles').select('role').eq('id', callerId).maybeSingle();
    if (me?.role !== 'admin') return json({ error: 'Forbidden: admins only' }, 403);
  }

  const { data: target } = await admin.from('profiles').select('id,username').eq('id', id).maybeSingle();
  if (!target) return json({ error: 'User not found' }, 404);

  // 1) Soft-delete their members (mirrors Django destroy)
  await admin.from('members').update({ is_deleted: true }).eq('created_by', id);

  // 2) Delete auth user first — FK cascade removes the profile row too.
  const { error: authErr } = await admin.auth.admin.deleteUser(id);
  if (authErr) return json({ error: `Auth delete failed: ${authErr.message}` }, 500);

  // 3) Belt-and-braces: explicit profile delete (no-op if cascaded)
  await admin.from('profiles').delete().eq('id', id);

  // 4) Audit (best-effort)
  await admin.from('audit_logs').insert({
    user_id: callerId,
    action: 'delete',
    resource_type: 'user',
    resource_id: id,
    details: { deleted_user: (target as { username?: string }).username, via: 'edge-function' },
    ip_address: '',
    user_agent: '',
  });

  return json({ success: true }, 200);
});
