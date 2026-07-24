import { supabase } from './supabase';

/**
 * Save a key/value pair to the cloud for the current user.
 * Uses upsert so repeated saves don't create duplicates.
 */
export async function cloudSave(key, data, explicitUserId = null) {
  if (!supabase) return;
  let userId = explicitUserId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }
  if (!userId) return;

  const { error } = await supabase.from('schedules').upsert(
    { user_id: userId, key, data, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' }
  );
  if (error) {
    console.error('Supabase cloudSave error:', error);
  }
}

/**
 * Load all saved keys for the current user.
 * Returns a flat object: { key: data, ... }
 */
export async function cloudLoad(explicitUserId = null) {
  if (!supabase) return null;
  let userId = explicitUserId;
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }
  if (!userId) return null;

  const { data, error } = await supabase
    .from('schedules')
    .select('key, data')
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase cloudLoad error:', error);
    return null;
  }
  if (!data) return null;

  // Filter out any garbage rows where data is not a valid JSON object
  const validRows = data.filter(
    (row) => row.data && typeof row.data === 'object' && !Array.isArray(row.data)
  );

  return Object.fromEntries(validRows.map((row) => [row.key, row.data]));
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
