"""
Bulk-apply demo-mode support across all Supabase config files and inline
HTML setups. Run from repo root after the repo has placeholder credentials
in place. Idempotent: re-running is safe (it replaces the same block).
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]

ES_MODULE_TEMPLATE = '''// ============================================================
// SUPABASE CONFIG (ES module) — {label}
// ============================================================
//
// DEMO MODE: when the URL/key below are still the SETUP.md placeholders,
// the platform runs in a self-contained demo mode (no backend required).
// Auth succeeds with a guest user, DB writes are no-ops, and leaderboards
// show empty. Replace the placeholders with your own Supabase project
// values to enable real persistence and leaderboards. See SETUP.md.
// ============================================================

import {{ createClient }} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const DEMO_MODE =
  SUPABASE_URL.includes('YOUR_PROJECT_REF') ||
  SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';

function makeDemoClient() {{
  const DEMO_USER = {{
    id: 'guest-demo',
    email: 'guest@demo.local',
    user_metadata: {{ username: 'Guest' }},
  }};
  const session = {{ user: DEMO_USER, access_token: 'demo' }};
  const ok = (data) => Promise.resolve({{ data, error: null }});
  const builderMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is',
    'like', 'ilike', 'or', 'and', 'order', 'limit', 'range',
    'single', 'maybeSingle', 'filter', 'match', 'not',
    'contains', 'containedBy', 'overlaps', 'textSearch', 'returns',
  ];
  function builder() {{
    const b = {{
      then: (resolve) => resolve({{ data: [], error: null }}),
      catch: () => b,
    }};
    builderMethods.forEach((m) => {{ b[m] = () => b; }});
    return b;
  }}
  return {{
    auth: {{
      getSession: () => ok({{ session }}),
      getUser: () => ok({{ user: DEMO_USER }}),
      signInWithPassword: () => ok({{ user: DEMO_USER, session }}),
      signUp: () => ok({{ user: DEMO_USER, session }}),
      signOut: () => ok(null),
      onAuthStateChange: () => ({{
        data: {{ subscription: {{ unsubscribe: () => {{}} }} }},
      }}),
    }},
    from: () => builder(),
    rpc: () => Promise.resolve({{ data: null, error: null }}),
  }};
}}

export const supabase = DEMO_MODE
  ? makeDemoClient()
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
'''


GLOBAL_SCRIPT_TEMPLATE = '''// Supabase configuration (global script style)
//
// DEMO MODE: when the URL/key are still the SETUP.md placeholders, runs
// in a self-contained demo mode with a guest user and no real backend.
// See SETUP.md to switch to a real Supabase project.

const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const DEMO_MODE =
  SUPABASE_URL.includes('YOUR_PROJECT_REF') ||
  SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';

function __makeDemoSupabaseClient() {
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

const { createClient } = supabase;
const supabaseClient = DEMO_MODE
  ? __makeDemoSupabaseClient()
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
'''


# Inline-HTML block that defines DEMO_MODE and the stub factory. It is
# inserted just before any line that calls createClient(SUPABASE_URL,
# SUPABASE_ANON_KEY). Then the createClient call is rewritten to a
# conditional that uses the stub when DEMO_MODE is true.
INLINE_HELPER_BLOCK = '''const DEMO_MODE = SUPABASE_URL.includes('YOUR_PROJECT_REF') || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY';
function __makeDemoSupabaseClient() {
  const DEMO_USER = { id: 'guest-demo', email: 'guest@demo.local', user_metadata: { username: 'Guest' } };
  const session = { user: DEMO_USER, access_token: 'demo' };
  const ok = (data) => Promise.resolve({ data, error: null });
  const builderMethods = ['select','insert','update','upsert','delete','eq','neq','gt','gte','lt','lte','in','is','like','ilike','or','and','order','limit','range','single','maybeSingle','filter','match','not','contains','containedBy','overlaps','textSearch','returns'];
  function builder() {
    const b = { then: (r) => r({ data: [], error: null }), catch: () => b };
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
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => builder(),
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}
'''


def git_files(pattern: str) -> list[Path]:
    out = subprocess.check_output(['git', 'ls-files', pattern], cwd=REPO, text=True)
    return [REPO / line for line in out.splitlines() if line]


def write_es_module_configs():
    files = git_files('**/supabase-config.js')
    changed = []
    for fp in files:
        text = fp.read_text(encoding='utf-8')
        if 'import { createClient }' not in text and "import {createClient}" not in text:
            continue  # skip global-script variants
        # Pull a label from the existing comment if present.
        m = re.search(r'SUPABASE CONFIG[^\n]*?([\w &-]+?)\n', text)
        label = (m.group(1).strip(' —-') if m else 'Supabase client')
        if not label:
            label = 'Supabase client'
        new_text = ES_MODULE_TEMPLATE.format(label=label)
        if text != new_text:
            fp.write_text(new_text, encoding='utf-8')
            changed.append(fp)
    return changed


def write_global_configs():
    files = git_files('**/supabase-config.js')
    changed = []
    for fp in files:
        text = fp.read_text(encoding='utf-8')
        if 'import { createClient }' in text or "import {createClient}" in text:
            continue  # ES module variant
        if 'const { createClient } = supabase' not in text and \
           'supabase.createClient' not in text:
            continue
        if text != GLOBAL_SCRIPT_TEMPLATE:
            fp.write_text(GLOBAL_SCRIPT_TEMPLATE, encoding='utf-8')
            changed.append(fp)
    return changed


CREATE_CLIENT_RE = re.compile(
    r"^(?P<indent>\s*)(?P<decl>const|let|var)\s+(?P<name>\w+)\s*=\s*"
    r"(?P<call>(?:supabase\.)?createClient)\s*\(\s*SUPABASE_URL\s*,\s*SUPABASE_ANON_KEY\s*\)\s*;",
    re.MULTILINE,
)

URL_LINE_RE = re.compile(
    r"^(?P<indent>\s*)const\s+SUPABASE_URL\s*=\s*'https://YOUR_PROJECT_REF\.supabase\.co';",
    re.MULTILINE,
)


def patch_inline_html(fp: Path) -> bool:
    text = fp.read_text(encoding='utf-8')
    if 'YOUR_PROJECT_REF' not in text:
        return False
    if 'DEMO_MODE' in text and '__makeDemoSupabaseClient' in text:
        return False  # already patched

    m_url = URL_LINE_RE.search(text)
    m_call = CREATE_CLIENT_RE.search(text)
    if not m_url or not m_call:
        return False

    indent = m_url.group('indent')

    # Insert helper block immediately after the SUPABASE_ANON_KEY line.
    anon_key_pattern = re.compile(
        r"^(?P<i>\s*)const\s+SUPABASE_ANON_KEY\s*=\s*'YOUR_SUPABASE_ANON_KEY';",
        re.MULTILINE,
    )
    m_anon = anon_key_pattern.search(text)
    if not m_anon:
        return False
    helper_indented = '\n'.join(
        (indent + line) if line else '' for line in INLINE_HELPER_BLOCK.splitlines()
    )
    text = (
        text[: m_anon.end()] + '\n' + helper_indented + text[m_anon.end():]
    )

    # Rewrite the createClient assignment.
    def repl(m):
        return (
            f"{m.group('indent')}{m.group('decl')} {m.group('name')} = "
            f"DEMO_MODE ? __makeDemoSupabaseClient() : "
            f"{m.group('call')}(SUPABASE_URL, SUPABASE_ANON_KEY);"
        )

    text = CREATE_CLIENT_RE.sub(repl, text)

    fp.write_text(text, encoding='utf-8')
    return True


def patch_all_inline():
    files = git_files('*.html')
    changed = []
    for fp in files:
        if patch_inline_html(fp):
            changed.append(fp)
    return changed


if __name__ == '__main__':
    es_changed = write_es_module_configs()
    print(f'ES module configs updated: {len(es_changed)}')
    for f in es_changed:
        print(f'  {f.relative_to(REPO)}')

    global_changed = write_global_configs()
    print(f'Global-script configs updated: {len(global_changed)}')
    for f in global_changed:
        print(f'  {f.relative_to(REPO)}')

    html_changed = patch_all_inline()
    print(f'Inline HTML files patched: {len(html_changed)}')
    for f in html_changed:
        print(f'  {f.relative_to(REPO)}')
