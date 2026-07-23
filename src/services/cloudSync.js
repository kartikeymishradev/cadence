import { supabase } from './supabase';

/**
 * Save a key/value pair to the cloud for the current user.
 * Uses upsert so repeated saves don't create duplicates.
 */
export async function cloudSave(key, data) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('schedules').upsert(
    { user_id: user.id, key, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' }
  );
}

/**
 * Load all saved keys for the current user.
 * Returns a flat object: { key: data, ... }
 */
export async function cloudLoad() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('schedules')
    .select('key, data')
    .eq('user_id', user.id);

  if (error || !data) return null;

  return Object.fromEntries(data.map((row) => [row.key, row.data]));
}

/**
 * Sign in with Google via Supabase OAuth.
 * Redirects back to the app after login.
 */
export async function signInWithGoogle() {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
