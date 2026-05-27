// Smoke test for the demo stub client. Node can't load the https://-CDN
// import that supabase-config.js uses, so we reconstruct just the stub
// factory locally (this MUST stay in sync with the inlined factory in
// scripts/apply-demo-mode.py). Then we exercise the shapes the games call.

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

const supabase = makeDemoClient();
const checks = [];

async function run(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
  } catch (err) {
    checks.push({ name, ok: false, err: String(err) });
  }
}

await run('auth.getSession returns demo session', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user || session.user.id !== 'guest-demo') throw new Error('no demo session');
});

await run('auth.signInWithPassword succeeds', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'x', password: 'y' });
  if (error) throw error;
  if (!data.user) throw new Error('no user');
});

await run('auth.signUp succeeds', async () => {
  const { data, error } = await supabase.auth.signUp({ email: 'x', password: 'y' });
  if (error) throw error;
  if (!data.user) throw new Error('no user');
});

await run('auth.signOut returns ok', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

await run('auth.onAuthStateChange returns subscription handle', async () => {
  const { data } = supabase.auth.onAuthStateChange(() => {});
  data.subscription.unsubscribe();
});

await run('from(table).select returns empty array (awaited)', async () => {
  const { data, error } = await supabase.from('scores').select('*');
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 0) throw new Error('not empty array');
});

await run('from(table).select(...).eq(...).order(...).limit(...) chain', async () => {
  const { data, error } = await supabase
    .from('scores').select('*').eq('user_id', 'x').order('score', { ascending: false }).limit(10);
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('not array');
});

await run('from(table).insert returns ok', async () => {
  const { error } = await supabase.from('events').insert({ user_id: 'x', event: 'y' });
  if (error) throw error;
});

await run('from(table).update().eq returns ok', async () => {
  const { error } = await supabase.from('scores').update({ score: 0 }).eq('id', 1);
  if (error) throw error;
});

await run('from(table).upsert returns ok', async () => {
  const { error } = await supabase.from('settings').upsert({ id: 1, foo: 'bar' });
  if (error) throw error;
});

await run('rpc returns ok', async () => {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
});

await run('select().single() chain awaits without crash', async () => {
  await supabase.from('scores').select('*').eq('id', 1).single();
});

for (const c of checks) {
  console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.err ? '  →  ' + c.err : ''}`);
}

const failed = checks.filter((c) => !c.ok).length;
if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
