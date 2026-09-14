#!/usr/bin/env python3
"""Lint the bar against itself.

This arm has no spec. Its authority is checks/, so this is what a spec linter becomes:
a gate that refuses a criterion which proves nothing, or one whose text has drifted from
the inherited bar.

  python3 tools/speclint.py            # lint the working tree
  python3 tools/speclint.py --staged   # lint what is about to be committed (what the hook runs)
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = ROOT.parent
STAGED = '--staged' in sys.argv
INHERITED = REPO / 'traditional' / 'docs' / 'superpowers' / 'specs' / '2026-09-10-nullrun-traditional-design.md'

problems = []


def _prefix():
    r = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=ROOT,
                       capture_output=True, text=True)
    if r.returncode != 0:
        return ''
    top = pathlib.Path(r.stdout.strip()).resolve()
    rel = ROOT.relative_to(top).as_posix()
    return '' if rel == '.' else rel + '/'


PREFIX = _prefix()


def read(rel):
    """Staged content when linting a commit, else the working tree. '' if absent."""
    if STAGED:
        for ref in (f':{PREFIX}{rel}', f'HEAD:{PREFIX}{rel}'):
            r = subprocess.run(['git', 'show', ref], cwd=ROOT, capture_output=True, text=True)
            if r.returncode == 0:
                return r.stdout
        return ''
    p = ROOT / rel
    return p.read_text() if p.exists() else ''


def listdir(rel):
    if STAGED:
        # cwd is already ROOT (inside the arm), so the pathspec is relative to it —
        # PREFIX would double it (PREFIX is only for git-show refs, which take a
        # path from the repo top regardless of cwd).
        r = subprocess.run(['git', 'ls-files', rel], cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode != 0:
            return []
        names = [pathlib.Path(line).name for line in r.stdout.splitlines() if line.strip()]
        return sorted(set(names))
    p = ROOT / rel
    return sorted(f.name for f in p.iterdir()) if p.is_dir() else []


def field(src, name):
    """Read a single-quoted or double-quoted top-level field from a criterion module."""
    m = re.search(rf"^\s*{name}:\s*(['\"])(.*?)\1\s*,\s*$", src, re.M | re.S)
    return m.group(2) if m else None


def inherited_titles():
    text = INHERITED.read_text() if INHERITED.exists() else ''
    out = {}
    for m in re.finditer(r'^\|\s*(A\d+)\s*\|\s*(.+?)\s*\|', text, re.M):
        out[m.group(1)] = m.group(2).replace('**', '').strip()
    return out


# --- criteria present, numbered densely -------------------------------------
files = [f for f in listdir('checks/criteria') if f.endswith('.mjs')]
found = {}
for f in files:
    src = read(f'checks/criteria/{f}')
    cid = field(src, 'id')
    if not cid:
        problems.append(f'checks/criteria/{f}: no id')
        continue
    if cid in found:
        problems.append(f'duplicate criterion id {cid}')
    found[cid] = (f, src)

nums = sorted(int(c[1:]) for c in found if re.fullmatch(r'A\d+', c))
if nums:
    gaps = [n for n in range(1, max(nums) + 1) if n not in nums]
    if gaps:
        problems.append('criterion gap ' + str(['A%d' % n for n in gaps]) +
                        ' — a criterion was removed, or never written. This is the failure mode '
                        'that let traditional ship A9 enforced nowhere.')
if nums and max(nums) < 17:
    problems.append(f'only A1..A{max(nums)} present; the inherited bar is A1..A17')

# --- titles match the inherited bar verbatim --------------------------------
titles = inherited_titles()
if not titles:
    problems.append(f'cannot read the inherited criteria from {INHERITED}')
for cid, (fname, src) in sorted(found.items()):
    want = titles.get(cid)
    got = field(src, 'title')
    if want is None:
        problems.append(f'{cid} ({fname}) is not in the inherited bar')
    elif got is None:
        problems.append(f'{cid} ({fname}): no title')
    elif got.strip() != want.strip():
        problems.append(f'{cid} ({fname}): title has drifted from the inherited bar\n'
                        f'    inherited: {want}\n'
                        f'    here:      {got}')

# --- every criterion is named by at least one mutant ------------------------
mutant_src = read('checks/mutants/oracle.mjs') + read('checks/mutants/artifact.mjs')
expected = set(re.findall(r"'(A\d+)'", mutant_src))
for cid in sorted(found):
    if cid not in expected:
        problems.append(f'{cid}: no mutant is written to catch it — it may be hollow')

# --- oracle criteria declare their fixture verdicts -------------------------
for cid, (fname, src) in sorted(found.items()):
    if field(src, 'surface') != 'oracle':
        continue
    if 'selftest:' not in src:
        problems.append(f'{cid} ({fname}): no selftest declaration')
        continue
    for fixture in ('hollow', 'faithful'):
        if not re.search(rf'{fixture}:\s*[\'"](pass|fail)[\'"]', src):
            problems.append(f'{cid} ({fname}): selftest does not declare a verdict for {fixture}')

# --- if a build exists, the kill matrix must be lethal ----------------------
if (ROOT / 'oracle.mjs').exists():
    mpath = ROOT / 'checks' / 'matrix.json'
    if not mpath.exists():
        problems.append('a build exists but checks/matrix.json does not — run: node checks/matrix.mjs')
    else:
        try:
            matrix = json.loads(mpath.read_text())
        except json.JSONDecodeError as e:
            problems.append(f'checks/matrix.json is not readable: {e}')
            matrix = None
        if matrix is not None:
            if matrix.get('hollow'):
                problems.append('criteria that kill no mutant: ' + ', '.join(matrix['hollow']))
            if matrix.get('survivors'):
                problems.append('mutants no criterion catches: ' + ', '.join(matrix['survivors']))
            if not matrix.get('lethal'):
                problems.append('the kill matrix is not lethal — K-prime is not satisfied')

# --- a criterion that keeps its title while its check is gutted -------------
# The title check above compares a string; nothing in it looks at the assertion
# underneath. A hollowed-out criterion passes the hollow fixture, which breaks its
# own declared verdict — so run the suite's self-test and let it say so.
checks_touched = any(f.endswith('.mjs') for f in listdir('checks/criteria'))
run_selftest = checks_touched
if STAGED and checks_touched:
    # Same cwd-vs-PREFIX note as listdir(): cwd is already ROOT, so the pathspec
    # is 'checks', not PREFIX + 'checks' (which would point outside the arm).
    r = subprocess.run(['git', 'diff', '--quiet', '--', 'checks'], cwd=ROOT)
    if r.returncode != 0:
        problems.append('checks/ has unstaged changes, so the selftest cannot speak for what is '
                        'being committed — stage them or revert them')
        run_selftest = False
if run_selftest:
    r = subprocess.run(['node', 'checks/run.mjs', '--selftest'],
                       cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        failing = [l for l in r.stdout.splitlines() if l.startswith('FAIL')]
        problems.append('the check suite fails its own selftest:\n    ' +
                        '\n    '.join(failing or [r.stderr.strip()[:200]]))

if problems:
    print('speclint (goal-driven):')
    for p in problems:
        print('  ' + p)
    sys.exit(1)

print('speclint (goal-driven): clean')
