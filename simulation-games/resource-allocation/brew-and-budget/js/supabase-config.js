// ============================================================
// SUPABASE CONFIG (ES module) — ES module Supabase client for Brew & Budget
// ============================================================
//
// DEMO MODE: when the URL/key below are still the SETUP.md placeholders,
// the platform runs in a self-contained demo mode (no backend required).
// Auth succeeds with a guest user, DB writes are no-ops, and leaderboards
// show empty. Replace the placeholders with your own Supabase project
// values to enable real persistence and leaderboards. See SETUP.md.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const DEMO_MODE =
  SUPABASE_URL.includes('YOUR_PROJECT_REF') ||
  SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';

function makeDemoClient() {
  const DEMO_USER = {
    id: 'guest-demo',
    email: 'guest@demo.local',
    user_metadata: { username: 'Guest' },
  };
  const session = { user: DEMO_USER, access_token: 'demo' };
  const ok = (data) => Promise.resolve({ data, error: null });
  const builderMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is',
    'like', 'ilike', 'or', 'and', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'filter', 'match', 'not',
    'contains', 'containedBy', 'overlaps', 'textSearch', 'returns',
  ];
  function builder() {
    const b = {
      then: (resolve) => resolve({ data: [], error: null }),
      catch: () => b,
    };
    builderMethods.forEach((m) => { b[m] = () => b; });
    return b;
  }
  return {
    auth: {
      getSession: () => ok({ session }),
      getUser: () => ok({ user: DEMO_USER }),
      signInWithPassword: () => ok({ user: DEMO_USER, session }),
      signUp: () => ok({ user: DEMO_USER, session }),
      signOut: () => ok(null),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => builder(),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

export const supabase = DEMO_MODE
  ? makeDemoClient()
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
