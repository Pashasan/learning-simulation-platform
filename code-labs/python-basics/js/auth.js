// ============================================================
// AUTH — Session guard and user info for Intro to Python
// ============================================================

import { supabase } from './supabase-config.js';

let _currentUser = null;

/**
 * Check session and redirect to login if unauthenticated.
 * Returns the user object on success, null on redirect.
 */
export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  _currentUser = session.user;

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      _currentUser = null;
      window.location.href = 'index.html';
    }
  });

  return _currentUser;
}

/**
 * Returns the current authenticated user object, or null.
 */
export function getCurrentUser() {
  return _currentUser;
}

/**
 * Returns the user's display name from metadata, or email prefix.
 */
export function getUserDisplayName() {
  if (!_currentUser) return 'Guest';
  const meta = _currentUser.user_metadata;
  return meta?.username || meta?.display_name || _currentUser.email?.split('@')[0] || 'Player';
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
}
