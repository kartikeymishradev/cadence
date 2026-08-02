import { supabase } from './supabase';

/**
 * Helper to get the currently authenticated user ID from Supabase auth.
 * Verifies that the requested target userId matches the active session user ID.
 */
async function getAuthenticatedUserId(requestedUserId = null) {
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.id) return null;

  // Security guard: If an explicit userId was requested, verify it matches auth.uid()
  if (requestedUserId && requestedUserId !== user.id) {
    console.warn(`[Security Guard] Blocked cross-user cloud attempt. Requested: ${requestedUserId}, Auth: ${user.id}`);
    return null;
  }

  return user.id;
}

/**
 * Save a key/value pair to the cloud for the authenticated user.
 * Uses upsert so repeated saves don't create duplicates.
 */
export async function cloudSave(key, data, explicitUserId = null) {
  if (!supabase) return;
  const userId = await getAuthenticatedUserId(explicitUserId);
  if (!userId) return;

  const nowIso = new Date().toISOString();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey && token) {
      const url = `${supabaseUrl}/rest/v1/schedules?on_conflict=user_id,key`;
      const body = JSON.stringify({
        user_id: userId,
        key,
        data,
        updated_at: nowIso,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body,
        keepalive: true, // Guarantees execution post-unload across modern browsers
      });

      if (res.ok) return;
    }
  } catch {
    // Fallback to standard Supabase client upsert
  }

  const { error } = await supabase.from('schedules').upsert(
    { user_id: userId, key, data, updated_at: nowIso },
    { onConflict: 'user_id,key' }
  );
  if (error) {
    console.error('Supabase cloudSave fallback error:', error);
  }
}

/**
 * Load all saved keys for the authenticated user.
 * Returns a flat object: { key: data, ... }
 */
export async function cloudLoad(explicitUserId = null) {
  if (!supabase) return null;
  const userId = await getAuthenticatedUserId(explicitUserId);
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

  // Filter out any invalid rows where data is not a valid object
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

/**
 * Delete all saved data for the authenticated user.
 */
export async function cloudDeleteAll(explicitUserId = null) {
  if (!supabase) return;
  const userId = await getAuthenticatedUserId(explicitUserId);
  if (!userId) return;

  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('user_id', userId);
    
  if (error) {
    console.error('Supabase cloudDeleteAll error:', error);
  }
}
