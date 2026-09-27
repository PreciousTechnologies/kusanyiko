import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Soft warning — app still boots so LandingPage (public branding fallback) works.
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️ Supabase env missing. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY in frontend/.env'
  );
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'kusanyiko-supabase-auth',
  },
});

// Storage bucket for member photos (mirrors Django media/member_pictures/)
export const MEMBER_PICTURES_BUCKET = 'member_pictures';

export function publicPictureUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const { data } = supabase.storage.from(MEMBER_PICTURES_BUCKET).getPublicUrl(pathOrUrl);
  return data?.publicUrl ?? null;
}
