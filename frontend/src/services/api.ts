/* Supabase API layer — drop-in replacement for services/api.ts (Django).
 *
 * Keeps the SAME exported names (membersAPI, userManagementAPI, exportAPI,
 * authAPI, statsAPI, brandingAPI) so Redux slices + pages keep working with
 * only an import-path change.
 *
 * Mapping:
 *  Django /api/auth/*      → supabase.auth + public.profiles
 *  Django /api/members/*   → public.members (+ storage/member_pictures)
 *  Django /api/stats/*     → client-side aggregation over public.members
 *  Django /api/export/*    → client-side CSV/Excel/PDF via utils/exportHelpers
 *  Django AuditLog         → public.audit_logs
 */
import { supabase, MEMBER_PICTURES_BUCKET, publicPictureUrl } from '../utils/supabaseClient';
import { buildExportBlob, asAxiosBlobResponse, ExportFormat } from '../utils/exportHelpers';

// ---------- small helpers ----------
async function currentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

async function logAudit(action: string, resource_type: string, resource_id = '', details: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_logs').insert({
      user_id: user?.id ?? null,
      action,
      resource_type,
      resource_id: String(resource_id),
      details,
      ip_address: '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    });
  } catch { /* audit must never break the app */ }
}

function mapMemberRow(m: any) {
  if (!m) return m;
  return { ...m, picture: m.picture_url ? publicPictureUrl(m.picture_url) : null };
}

async function uploadMemberPicture(file: File, userId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(MEMBER_PICTURES_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

function formDataToMemberPayload(fd: FormData) {
  const payload: Record<string, any> = {};
  let file: File | null = null;
  fd.forEach((value, key) => {
    if (value instanceof File && value.size > 0) {
      if (key === 'picture' || key === 'picture_url') file = value;
      return;
    }
    if (typeof value === 'string') payload[key] = value;
  });
  // Normalise booleans/numbers Django used to coerce
  if (payload.saved !== undefined) payload.saved = payload.saved === 'true' || payload.saved === true || payload.saved === '1';
  if (payload.age !== undefined && payload.age !== '') payload.age = Number(payload.age);
  if (payload.visitors_count !== undefined && payload.visitors_count !== '') payload.visitors_count = Number(payload.visitors_count);
  if (payload.attending_date === '') delete payload.attending_date;
  return { payload, file };
}

// ============================================================
// AUTH — mirrors authAPI.login/register/forgotPassword/etc.
// Supabase needs EMAIL; Django allowed username OR email.
// ============================================================
async function resolveEmailForLogin(usernameOrEmail: string): Promise<string> {
  if (usernameOrEmail.includes('@')) return usernameOrEmail;
  // Username lookup via RPC: profiles has no anon SELECT policy (by design),
  // so a security-definer function resolves one username → email.
  // SQL (run once in dashboard): see LOGIN_RPC note below.
  const { data, error } = await supabase.rpc('resolve_login_email', { p_login: usernameOrEmail });
  if (error || !data) throw { response: { data: { error: 'Invalid credentials' } } };
  return data as string;
}

export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    const email = await resolveEmailForLogin(credentials.username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: credentials.password });
    if (error) throw { response: { data: { error: error.message } } };
    const profile = await currentProfile();
    if (profile?.status && profile.status !== 'active') {
      await supabase.auth.signOut();
      throw { response: { data: { error: `Account is ${profile.status}. Contact admin.` } } };
    }
    await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
    await logAudit('login', 'user', data.user.id, { username: profile?.username });
    return { data: { access: data.session?.access_token, refresh: data.session?.refresh_token, user: toFrontendUser(profile) } };
  },

  register: (userData: any) => authAPI.signup(userData),

  signup: async (userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role || 'registrant',
          kanda: userData.kanda || '',
          country: userData.country || '',
          region: userData.region || '',
        },
      },
    });
    if (error) throw { response: { data: { error: error.message } } };
    // Email confirmation is disabled project-wide (Supabase Auth → Confirm email OFF,
    // plus mailer autoconfirm), so a session always comes back immediately.
    if (!data.session) {
      throw { response: { data: { error: 'Account created but no session started. Please sign in.' } } };
    }
    // Wait a tick for handle_new_user() trigger, then fetch profile
    await new Promise((r) => setTimeout(r, 800));
    const profile = await currentProfile();
    await logAudit('create', 'user', data.user?.id, { username: userData.username });
    return { data: { user: toFrontendUser(profile), access: data.session.access_token, refresh: data.session.refresh_token, message: 'Account created successfully!' } };
  },

  refreshToken: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return { data };
  },

  resetPassword: async (payload: { token?: string; new_password?: string; password?: string }) => {
    // Supabase uses email-link flow; direct token set isn't supported client-side.
    // This is called from ResetPasswordPage after user clicks email link (detectSessionInUrl handles it).
    const newPw = payload.new_password || payload.password;
    if (!newPw) throw { response: { data: { error: 'New password required' } } };
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) throw { response: { data: { error: error.message } } };
    return { data: { message: 'Password has been reset successfully.' } };
  },

  forgotPassword: async (payload: { email: string }) => {
    const redirectTo = `${window.location.origin}/#/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, { redirectTo });
    if (error) throw { response: { data: { error: error.message } } };
    return { data: { message: 'Password reset link has been sent to your email.' } };
  },

  getProfile: async () => {
    const profile = await currentProfile();
    if (!profile) throw { response: { status: 401, data: { error: 'Not authenticated' } } };
    return { data: toFrontendUser(profile) };
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    // Supabase has no "verify current password" endpoint — re-authenticate,
    // then set the new password on the verified session.
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email ?? (await currentProfile())?.email;
    if (!user || !email) throw { response: { data: { message: 'Not authenticated' } } };
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signErr) throw { response: { data: { message: 'Current password is incorrect' } } };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('update', 'user', user.id, { password_changed: true });
    return { data: { message: 'Password changed successfully.' } };
  },
};

function toFrontendUser(p: any): any {
  if (!p) return null;
  return {
    id: p.id, // uuid now (was int in Django) — Redux + pages treat as opaque id
    legacy_id: p.legacy_id,
    username: p.username,
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    role: p.role,
    status: p.status,
    kanda: p.kanda,
    country: p.country,
    region: p.region,
    is_staff: p.is_staff,
    is_superuser: p.is_superuser,
    date_joined: p.date_joined,
    last_login: p.last_login,
    // Avatar lives in the member_pictures bucket; resolve to a public URL.
    profile_picture: p.avatar_url ? publicPictureUrl(p.avatar_url) : null,
  };
}

// Upload a user avatar (<user_id>/avatars/…) — upsert so re-uploads replace.
async function uploadAvatar(file: File, userId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(MEMBER_PICTURES_BUCKET).upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;
  return path;
}

// ============================================================
// MEMBERS — mirrors membersAPI
// ============================================================
export const membersAPI = {
  getMembers: async (params: any = {}) => {
    let q = supabase.from('members').select('*', { count: 'exact' }).eq('is_deleted', false).order('created_at', { ascending: false });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`first_name.ilike.${s},last_name.ilike.${s},middle_name.ilike.${s},mobile_no.ilike.${s},email.ilike.${s}`);
    }
    if (params.gender) q = q.eq('gender', params.gender);
    if (params.region) q = q.ilike('region', `%${params.region}%`);
    if (params.center_area) q = q.ilike('center_area', `%${params.center_area}%`);
    if (params.country) q = q.ilike('country', `%${params.country}%`);
    if (params.saved !== undefined && params.saved !== null && params.saved !== '') {
      const b = params.saved === true || params.saved === 'true' || params.saved === '1';
      q = q.eq('saved', b);
    }
    if (params.created_by) q = q.eq('created_by', params.created_by);
    // RLS enforces registrant=own / apostle=kanda / admin=all automatically.
    const { data, error, count } = await q;
    if (error) throw { response: { data: { message: error.message } } };
    const members = (data || []).map(mapMemberRow);
    // Return a plain array (membersSlice normalizer + SearchMembers both accept arrays)
    return { data: members as any };
  },

  getMember: async (id: string | number) => {
    const { data, error } = await supabase.from('members').select('*').eq('id', String(id)).single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: mapMemberRow(data) };
  },

  createMember: async (memberData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { response: { data: { message: 'Not authenticated' } } };
    let payload: Record<string, any> = { ...(memberData || {}) };
    let file: File | null = null;
    if (memberData instanceof FormData) {
      const parsed = formDataToMemberPayload(memberData);
      payload = parsed.payload;
      file = parsed.file;
    } else if (payload.picture instanceof File) {
      file = payload.picture;
      delete payload.picture;
    }
    delete payload.picture_url;
    delete payload.created_by;
    if (file) payload.picture_url = await uploadMemberPicture(file, user.id);
    const { data, error } = await supabase.from('members').insert({ ...payload, created_by: user.id }).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('create', 'member', data.id, { name: `${data.first_name} ${data.last_name}` });
    return { data: mapMemberRow(data) };
  },

  updateMember: async (id: string | number, memberData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    let payload: Record<string, any> = { ...(memberData || {}) };
    let file: File | null = null;
    if (memberData instanceof FormData) {
      const parsed = formDataToMemberPayload(memberData);
      payload = parsed.payload;
      file = parsed.file;
    } else if (payload.picture instanceof File) {
      file = payload.picture;
      delete payload.picture;
    }
    delete payload.id;
    delete payload.created_by;
    delete payload.created_at;
    if (file && user) payload.picture_url = await uploadMemberPicture(file, user.id);
    const { data, error } = await supabase.from('members').update(payload).eq('id', String(id)).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('update', 'member', String(id), { fields: Object.keys(payload) });
    return { data: mapMemberRow(data) };
  },

  deleteMember: async (id: string | number) => {
    // Soft delete (mirrors Django perform_destroy)
    const { error } = await supabase.from('members').update({ is_deleted: true }).eq('id', String(id));
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('delete', 'member', String(id), { soft_deleted: true });
    return { data: { success: true } };
  },

  searchMembers: async (searchTerm: string) => {
    if (!searchTerm?.trim()) return { data: [] };
    const s = `%${searchTerm.trim()}%`;
    const { data, error } = await supabase
      .from('members')
      .select('id,first_name,middle_name,last_name,gender,region,center_area,picture_url')
      .eq('is_deleted', false)
      .or(`first_name.ilike.${s},last_name.ilike.${s},middle_name.ilike.${s},mobile_no.ilike.${s},email.ilike.${s}`)
      .limit(50);
    if (error) throw { response: { data: { message: error.message } } };
    return { data: (data || []).map(mapMemberRow) };
  },

  exportMembers: (format: 'csv' | 'excel' | 'pdf' = 'csv', filters: any = {}) =>
    exportAPI.exportMembers(format, filters),
};

// ---------- Edge Functions (admin user management) ----------
// create-user / delete-user run with the service role (Auth Admin API):
// no session swap, no public-signup rate limits, full auth-row delete.
// If the functions aren't deployed yet we fall back to the legacy
// browser flow so the UI keeps working during rollout.
function isFunctionMissingError(e: any): boolean {
  const status = e?.status ?? e?.context?.status;
  if (status === 404) return true;
  return /Failed to fetch|Load failed|NetworkError|not found/i.test(String(e?.message ?? ''));
}

// Poll for a profile row instead of a fixed sleep — the
// handle_new_user() trigger needs a moment after signUp.
async function waitForProfile(id: string, tries = 12, delayMs = 500): Promise<any | null> {
  for (let i = 0; i < tries; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) return data;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return null;
}

// Legacy browser-side creation (used only when the create-user
// Edge Function is not deployed). signUp swaps the admin session,
// so the restore MUST happen in a finally block.
async function legacyCreateUser(userData: any) {
  const { data: { session: adminSession } } = await supabase.auth.getSession();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role || 'registrant',
          kanda: userData.kanda || '',
          country: userData.country || '',
          region: userData.region || '',
        },
      },
    });
    if (error) throw { response: { data: { message: error.message } } };
    if (!data.user) throw { response: { data: { message: 'Signup returned no user record' } } };
    const base = await waitForProfile(data.user.id);
    if (!base) {
      throw {
        response: {
          data: {
            message: 'Account created but its profile row is missing — check the handle_new_user trigger, then refresh the list.',
          },
        },
      };
    }
    const { error: upErr } = await supabase.from('profiles').update({
      role: userData.role || 'registrant',
      kanda: userData.kanda || '',
      is_staff: userData.is_staff ?? (userData.role === 'admin'),
      is_superuser: userData.is_superuser ?? false,
    }).eq('id', data.user.id);
    if (upErr) throw { response: { data: { message: upErr.message } } };
    await logAudit('create', 'user', data.user.id, { created_user: userData.username });
    const created = await waitForProfile(data.user.id, 4, 400);
    return { data: toFrontendUser(created ?? base) };
  } finally {
    if (adminSession) {
      try { await supabase.auth.setSession(adminSession); } catch { /* keep current session */ }
    }
  }
}

// ============================================================
// USER MANAGEMENT — mirrors userManagementAPI (admin)
// ============================================================
export const userManagementAPI = {
  getUsers: async (params: any = {}) => {
    let q = supabase.from('profiles').select('*').order('date_joined', { ascending: false });
    if (params.search) {
      const s = `%${params.search}%`;
      q = q.or(`username.ilike.${s},email.ilike.${s},first_name.ilike.${s},last_name.ilike.${s}`);
    }
    if (params.role && params.role !== 'all') q = q.eq('role', params.role);
    if (params.status && params.status !== 'all') q = q.eq('status', params.status);
    const { data, error } = await q;
    if (error) throw { response: { data: { message: error.message } } };
    // Attach members_registered counts (Django annotated this)
    const withCounts = await Promise.all(
      (data || []).map(async (u: any) => {
        const { count } = await supabase.from('members').select('id', { count: 'exact', head: true }).eq('created_by', u.id).eq('is_deleted', false);
        return { ...toFrontendUser(u), members_registered: count ?? 0 };
      })
    );
    return { data: withCounts };
  },

  getUser: async (id: string | number) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', String(id)).single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: toFrontendUser(data) };
  },

  createUser: async (userData: any) => {
    const payload = {
      email: userData.email,
      password: userData.password,
      username: userData.username,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      role: userData.role || 'registrant',
      kanda: userData.kanda || '',
      country: userData.country || '',
      region: userData.region || '',
      status: userData.status || 'active',
      is_staff: userData.is_staff ?? (userData.role === 'admin'),
      is_superuser: userData.is_superuser ?? false,
    };
    if (!payload.password) {
      throw { response: { data: { message: 'A password is required to create a user' } } };
    }
    // Preferred: Edge Function (Admin API — no session swap, no signup rate limits)
    try {
      const { data, error } = await supabase.functions.invoke('create-user', { body: payload });
      if (error) throw error;
      const fnErr = (data as any)?.error;
      if (fnErr) throw { response: { data: { message: String(fnErr) } } };
      const created = (data as any)?.user ?? data;
      if (!created?.id) throw { response: { data: { message: 'User creation returned no profile' } } };
      return { data: toFrontendUser(created) };
    } catch (fnErr: any) {
      if (fnErr?.response || !isFunctionMissingError(fnErr)) throw fnErr; // real error → surface it
      return legacyCreateUser(userData); // function not deployed yet → legacy flow
    }
  },

  updateUser: async (id: string | number, userData: any) => {
    const clean = { ...userData };
    delete clean.id;
    delete clean.password;
    delete clean.members_registered;
    const { data, error } = await supabase.from('profiles').update(clean).eq('id', String(id)).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('update', 'user', String(id), { fields: Object.keys(clean) });
    return { data: toFrontendUser(data) };
  },

  deleteUser: async (id: string | number) => {
    // Preferred: Edge Function removes profile + auth row + soft-deletes members.
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', { body: { id: String(id) } });
      if (error) throw error;
      const fnErr = (data as any)?.error;
      if (fnErr) throw { response: { data: { message: String(fnErr) } } };
      return { data: { success: true } };
    } catch (fnErr: any) {
      if (fnErr?.response || !isFunctionMissingError(fnErr)) throw fnErr; // real error → surface it
      // Legacy fallback: soft-delete members + delete profile.
      // NOTE: the auth.users row survives this path — re-creating the same
      // email afterwards will hit "already registered". Deploy delete-user
      // to remove users fully.
      await supabase.from('members').update({ is_deleted: true }).eq('created_by', String(id));
      const { error } = await supabase.from('profiles').delete().eq('id', String(id));
      if (error) throw { response: { data: { error: error.message } } };
      await logAudit('delete', 'user', String(id), {});
      return { data: { success: true } };
    }
  },

  getCurrentUser: () => authAPI.getProfile(),
  updateProfile: (profileData: any) => userManagementAPI.updateOwnProfile(profileData),

  updateOwnProfile: async (profileData: any, avatarFile?: File | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { response: { data: { message: 'Not authenticated' } } };
    const clean = { ...profileData };
    // Own-profile edits must never drift privilege/identity fields:
    // role/status/flags are admin-only (User Management), and email changes
    // go through Supabase Auth's confirmation flow, not this table.
    delete clean.id;
    delete clean.role;
    delete clean.status;
    delete clean.is_staff;
    delete clean.is_superuser;
    delete clean.email;
    delete clean.members_registered;
    delete clean.profile_picture;
    if (avatarFile) clean.avatar_url = await uploadAvatar(avatarFile, user.id);
    const { data, error } = await supabase.from('profiles').update(clean).eq('id', user.id).select().single();
    if (error) {
      const msg = /duplicate|unique/i.test(error.message)
        ? 'That username is already taken. Choose another one.'
        : error.message;
      throw { response: { data: { message: msg } } };
    }
    await logAudit('update', 'user', user.id, { own_profile: true, fields: Object.keys(clean) });
    return { data: toFrontendUser(data) };
  },

  deleteOwnAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw { response: { data: { message: 'Not authenticated' } } };
    // The delete-user Edge Function allows self-deletion (admins only for others).
    const { data, error } = await supabase.functions.invoke('delete-user', { body: { id: user.id } });
    if (error) {
      if (isFunctionMissingError(error)) {
        throw { response: { data: { message: 'Account deletion is not deployed yet — ask an admin to deploy the delete-user function.' } } };
      }
      throw error;
    }
    const fnErr = (data as any)?.error;
    if (fnErr) throw { response: { data: { message: String(fnErr) } } };
    await supabase.auth.signOut();
    return { data: { success: true } };
  },

  updateUserStatus: async (id: string | number, status: string) => {
    const { data, error } = await supabase.from('profiles').update({ status }).eq('id', String(id)).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('update', 'user', String(id), { status_changed: { to: status } });
    return { data: toFrontendUser(data) };
  },

  resetUserPassword: async (id: string | number) => {
    // No service-role key in browser → send reset email instead of temp password.
    const { data: target } = await supabase.from('profiles').select('email,username').eq('id', String(id)).single();
    if (!target?.email) throw { response: { data: { message: 'User email not found' } } };
    const { error } = await supabase.auth.resetPasswordForEmail(target.email, { redirectTo: `${window.location.origin}/#/reset-password` });
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('reset_password', 'user', String(id), { via: 'reset_email' });
    return { data: { temporary_password: '(reset link emailed)', message: `Password reset link sent to ${target.email}` } };
  },

  unlockAccount: async (id: string | number) => {
    const { data, error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', String(id)).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    await logAudit('unlock_account', 'user', String(id), {});
    return { data: { status: 'success', message: 'Account unlocked' } };
  },

  getUserActivity: async (id: string | number) => {
    const { data, error } = await supabase.from('audit_logs').select('*').eq('user_id', String(id)).order('timestamp', { ascending: false }).limit(50);
    if (error) throw { response: { data: { message: error.message } } };
    return {
      data: (data || []).map((a: any) => ({
        id: a.id, action: a.action, timestamp: a.timestamp, ip_address: a.ip_address,
        user_agent: a.user_agent, details: a.details, resource_type: a.resource_type, resource_id: a.resource_id,
      })),
    };
  },
};

// ============================================================
// STATS — client-side aggregation (RLS already scopes rows)
// ============================================================
async function fetchScopedMembers() {
  const rows: any[] = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

function groupCount(rows: any[], key: string): any[] {
  const m: Record<string, number> = {};
  rows.forEach((r) => {
    const k = String(r[key] ?? '') || 'Not Specified';
    m[k] = (m[k] || 0) + 1;
  });
  return Object.keys(m)
    .map((k) => ({ [key]: k, count: m[k] }))
    .sort((a, b) => b.count - a.count);
}

export const statsAPI = {
  getAdminStats: async () => {
    const rows = await fetchScopedMembers();
    const now = Date.now();
    const recent = rows.filter((r) => now - new Date(r.created_at).getTime() < 30 * 864e5).length;
    // 8-week growth buckets
    const weekly_growth = Array.from({ length: 8 }, (_, i) => {
      const end = now - i * 7 * 864e5;
      const start = end - 7 * 864e5;
      const count = rows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= start && t < end;
      }).length;
      return { week: `Week ${8 - i}`, count };
    });
    return {
      data: {
        total_members: rows.length,
        country_stats: groupCount(rows, 'country'),
        region_stats: groupCount(rows, 'region'),
        gender_stats: groupCount(rows, 'gender'),
        marital_stats: groupCount(rows, 'marital_status'),
        saved_stats: groupCount(rows, 'saved'),
        recent_registrations: recent,
        weekly_growth,
      },
    };
  },

  getRegistrantStats: async () => {
    const rows = await fetchScopedMembers();
    const now = Date.now();
    const recent = rows.filter((r) => now - new Date(r.created_at).getTime() < 30 * 864e5).length;
    const weekly_performance = Array.from({ length: 4 }, (_, i) => {
      const end = now - i * 7 * 864e5;
      const start = end - 7 * 864e5;
      const count = rows.filter((r) => {
        const t = new Date(r.created_at).getTime();
        return t >= start && t < end;
      }).length;
      return { week: `Week ${4 - i}`, count };
    });
    return {
      data: {
        total_registered: rows.length,
        gender_stats: groupCount(rows, 'gender'),
        region_stats: groupCount(rows, 'region'),
        saved_stats: groupCount(rows, 'saved'),
        recent_registrations: recent,
        weekly_performance,
        recent_activity: rows.slice(0, 5).map((r) => ({ first_name: r.first_name, last_name: r.last_name, created_at: r.created_at })),
      },
    };
  },
};

// ============================================================
// BRANDING
// ============================================================
export const brandingAPI = {
  getBranding: async () => {
    const { data, error } = await supabase.from('branding_settings').select('*').eq('id', 1).single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data };
  },
  updateBranding: async (brandingData: any) => {
    const { data, error } = await supabase.from('branding_settings').update(brandingData).eq('id', 1).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data };
  },
};

// ============================================================
// EXPORTS — client-side (replaces /api/export/*)
// ============================================================
const MEMBER_HEADERS = ['First Name', 'Last Name', 'Email', 'Phone', 'Country', 'Region', 'Gender', 'Marital Status', 'Saved', 'Date Registered', 'Registered By'];

function memberExportRows(members: any[]) {
  return members.map((m: any) => ({
    'First Name': m.first_name,
    'Last Name': m.last_name,
    Email: m.email || '',
    Phone: m.mobile_no || '',
    Country: m.country || '',
    Region: m.region || '',
    Gender: m.gender || '',
    'Marital Status': m.marital_status || '',
    Saved: m.saved ? 'Yes' : 'No',
    'Date Registered': m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '',
    'Registered By': typeof m.created_by === 'string' ? m.created_by : '',
  }));
}

async function recordExport(export_type: string, format: string, filters_applied: any, file_size: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('export_history').insert({ export_type, format, created_by: user.id, file_size, filters_applied });
  } catch { /* ignore */ }
}

export const exportAPI = {
  exportMembers: async (format: 'csv' | 'excel' | 'pdf' = 'csv', filters: any = {}) => {
    const res = await membersAPI.getMembers(filters);
    const list = Array.isArray(res.data) ? res.data : res.data.results || [];
    const rows = memberExportRows(list);
    const { blob, filename, contentType } = await buildExportBlob('members-register', MEMBER_HEADERS, rows, format as ExportFormat);
    await recordExport('members', format, filters, `${(blob.size / 1024).toFixed(1)} KB`);
    return asAxiosBlobResponse(blob, filename, contentType);
  },

  exportAnalytics: async (format: 'csv' | 'excel' | 'pdf' = 'pdf', options: any = {}) => {
    const type = options.type || 'overview';
    const stats = (await statsAPI.getAdminStats()).data;
    const kpiRows = [
      { Indicator: 'Total Members Registered', Value: stats.total_members, 'Share (%)': 100 },
      ...stats.gender_stats.map((g: any) => ({
        Indicator: `${g.gender} Members`, Value: g.count,
        'Share (%)': stats.total_members ? Number(((g.count / stats.total_members) * 100).toFixed(1)) : 0,
      })),
    ];
    const { blob, filename, contentType } = await buildExportBlob(`${type}-report`, ['Indicator', 'Value', 'Share (%)'], kpiRows, (format === 'csv' ? 'excel' : format) as ExportFormat);
    await recordExport('analytics', format, options, `${(blob.size / 1024).toFixed(1)} KB`);
    return asAxiosBlobResponse(blob, filename, contentType);
  },

  exportUserActivity: async (format: 'csv' | 'excel' = 'csv', options: any = {}) => {
    let q = supabase.from('audit_logs').select('*, profiles!audit_logs_user_id_fkey(username)').order('timestamp', { ascending: false }).limit(2000);
    const { data, error } = await q;
    if (error) throw { response: { data: { message: error.message } } };
    const headers = ['User', 'Action', 'Resource Type', 'Resource ID', 'Timestamp', 'IP Address'];
    const rows = (data || []).map((l: any) => ({
      User: l.profiles?.username || l.user_id || 'N/A',
      Action: l.action,
      'Resource Type': l.resource_type,
      'Resource ID': l.resource_id,
      Timestamp: new Date(l.timestamp).toLocaleString(),
      'IP Address': l.ip_address || '',
    }));
    const { blob, filename, contentType } = await buildExportBlob('user-activity', headers, rows, format as ExportFormat);
    await recordExport('users', format, options, `${(blob.size / 1024).toFixed(1)} KB`);
    return asAxiosBlobResponse(blob, filename, contentType);
  },

  exportFinancial: async (format: 'excel' | 'pdf' = 'excel', options: any = {}) => {
    // Same as Django: placeholder — no financial model exists yet.
    const headers = ['Date', 'Type', 'Amount (TZS)', 'Member', 'Description'];
    const rows = [{ Date: new Date().toISOString().split('T')[0], Type: 'Tithe', 'Amount (TZS)': 100000, Member: 'Sample Member', Description: 'Monthly tithe' }];
    const { blob, filename, contentType } = await buildExportBlob('financial-summary', headers, rows, format as ExportFormat);
    await recordExport('financial', format, options, `${(blob.size / 1024).toFixed(1)} KB`);
    return asAxiosBlobResponse(blob, filename, contentType);
  },
};

export default supabase;

// ---------- backwards-compat with services/api.ts ----------
// These existed on the Django api module and are imported by a few
// components. They are no-ops under Supabase (no dynamic LAN backend).
export const TANZANIA_REGIONS = [
  { value: 'arusha', label: 'Arusha' },
  { value: 'dar_es_salaam', label: 'Dar es Salaam' },
  { value: 'dodoma', label: 'Dodoma' },
];

export const DAR_ES_SALAAM_AREAS = [
  { value: 'ilala', label: 'Ilala' },
  { value: 'kinondoni', label: 'Kinondoni' },
  { value: 'temeke', label: 'Temeke' },
  { value: 'kisukulu', label: 'Kisukulu' },
];

export function updateApiBaseURL(_newBaseURL: string): void {
  console.log('ℹ️ updateApiBaseURL is a no-op on Supabase (single cloud endpoint).');
}

export async function testConnection(_endpoint?: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('branding_settings').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function autoDetectEndpoint(): Promise<boolean> {
  return testConnection();
}
