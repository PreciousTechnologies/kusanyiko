// Shared helper for Kusanyiko Edge Functions.
// Verifies the caller's JWT and requires the 'admin' role.
// Import from function code with: import { ... } from '../_shared/auth.ts';

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function handleOptions(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return null;
}

export interface AdminContext {
  admin: SupabaseClient; // service-role client (bypasses RLS)
  callerId: string;
}

/** Returns AdminContext if caller is an authenticated admin, else a 401/403 Response. */
export async function requireAdmin(req: Request): Promise<AdminContext | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: 'Function misconfigured: missing Supabase env' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader) return json({ error: 'Not authenticated' }, 401);

  const caller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await caller.auth.getUser();
  if (error || !user) return json({ error: 'Not authenticated' }, 401);

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return json({ error: 'Forbidden: admins only' }, 403);

  return { admin, callerId: user.id };
}
