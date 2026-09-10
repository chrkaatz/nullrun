#!/usr/bin/env python3
"""Lint the spec against itself and against the build.

Derived and disposable (M1): reads the documents as text, stores nothing.

  python3 tools/speclint.py            # lint the working tree
  python3 tools/speclint.py --staged   # lint what is actually about to be committed
"""
import re, sys, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
STAGED = '--staged' in sys.argv

def read(rel):
    """Staged content when linting a commit, else the working tree. '' if absent."""
    if STAGED:
        for ref in (f':{rel}', f'HEAD:{rel}'):
            r = subprocess.run(['git', 'show', ref], cwd=ROOT,
                               capture_output=True, text=True)
            if r.returncode == 0:
                return r.stdout
        return ''
    p = ROOT / rel
    return p.read_text() if p.exists() else ''

def listdir(rel):
    if STAGED:
        r = subprocess.run(['git', 'ls-files', rel], cwd=ROOT, capture_output=True, text=True)
        return r.stdout.split()
    d = ROOT / rel
    return [str(p.relative_to(ROOT)) for p in d.glob('*')] if d.exists() else []

SPEC  = read('docs/NULLRUN-SPEC.md')
BUILD = read('nullrun.html')
LOG   = read('docs/CHANGELOG.md')
CONF  = {pathlib.Path(p).stem for p in listdir('docs/conformance') if p.endswith('.md')}

problems = []
def bad(kind, msg): problems.append((kind, msg))

if not SPEC:
    print('speclint: no spec found; nothing to check')
    sys.exit(0)

# ---- ids defined by the spec ------------------------------------------
def defined(prefix):
    return [m.group(1) for m in re.finditer(r'^- `(' + prefix + r'-?\d+)`', SPEC, re.M)]
ids = {p: defined(p) for p in ('FR', 'NFR', 'I', 'K', 'O')}

for p, got in ids.items():
    for x in {x for x in got if got.count(x) > 1}:
        bad('duplicate-id', f'{x} defined {got.count(x)} times')
    nums = sorted(int(re.search(r'\d+', x).group()) for x in set(got))
    if nums:
        gap = [n for n in range(1, max(nums) + 1) if n not in nums]
        # a hole usually means something was deleted and its job went with it
        if gap: bad('numbering-gap', f'{p}: missing {", ".join(map(str, gap))}')

# ---- cross-references must resolve ------------------------------------
allids = {x for v in ids.values() for x in v}
# §K cites invariants bare — "(I5, I7)" — so match both backticked and plain
refs = {m.group(1) for m in re.finditer(r'`((?:N?FR|[IKO])-?\d+)`', SPEC)}
for m in re.finditer(r'\(([^)]*(?:N?FR|[IKO])-?\d+[^)]*)\)', SPEC):
    refs |= set(re.findall(r'(?<![A-Za-z])((?:N?FR|[IKO])-?\d+)', m.group(1)))
for ref in refs:
    if ref not in allids:
        bad('dangling-ref', f'{ref} referenced but never defined')

# ---- M5 budget, read from M5's own text -------------------------------
m = re.search(r'under ([\d,]+) words', SPEC)
if m:
    budget, words = int(m.group(1).replace(',', '')), len(SPEC.split())
    if words > budget:
        bad('over-budget', f'{words} words > M5 budget of {budget}')

# ---- every invariant needs a check ------------------------------------
kblock = SPEC[SPEC.index('### §K'):] if '### §K' in SPEC else ''
for inv in ids['I']:
    if inv not in kblock:
        bad('unguarded-invariant', f'{inv} is referenced by no §K check')

# ---- §T must agree with the build's CONFIG (the M1 drift failure) -----
tune = re.search(r'Current values: (.+?)\n', SPEC, re.S)
cfg = {}
if 'var CONFIG' in BUILD:
    blob = BUILD[BUILD.index('var CONFIG'):]
    blob = blob[:blob.index('};')]
    cfg = dict(re.findall(r'(\w+)\s*:\s*([\d.]+)', blob))
ALIAS = {'firewall': 'firewall', 'RAM': 'ram', 'breach damage': 'breach',
         'breach growth': 'breachGrowth', 'repair': 'repair', 'roster cap': 'rosterCap',
         'trace max': 'traceMax', 'trace per turn': 'tracePerTurn',
         'layers': 'layers', 'offers per layer': 'offers'}
if tune and cfg:
    for label, key in ALIAS.items():
        mm = re.search(re.escape(label) + r' (\d+)', tune.group(1))
        if mm and key in cfg and mm.group(1) != cfg[key]:
            bad('spec-build-drift', f'§T says {label} {mm.group(1)}, CONFIG.{key} is {cfg[key]}')

# ---- a version must carry its record ----------------------------------
ver = re.search(r'\*\*Version:\*\* ([\d.]+)', SPEC)
if ver:
    v = ver.group(1)
    if LOG and f'- `{v}`' not in LOG:
        bad('missing-changelog', f'version {v} has no CHANGELOG entry')
    if CONF and v not in CONF:
        bad('missing-conformance', f'version {v} has no docs/conformance/{v}.md')

for kind, msg in problems:
    print(f'speclint: {kind}: {msg}')
print(f'\nspeclint: {len(problems)} problem(s)' if problems else 'speclint: clean')
sys.exit(1 if problems else 0)
