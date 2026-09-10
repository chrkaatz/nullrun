#!/usr/bin/env python3
"""Lint the spec against itself and against the build. Derived, disposable (M1)."""
import re, sys, os, json, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = (ROOT/'docs'/'NULLRUN-SPEC.md').read_text()
BUILD = (ROOT/'nullrun.html').read_text() if (ROOT/'nullrun.html').exists() else ''
LOG  = (ROOT/'docs'/'CHANGELOG.md').read_text() if (ROOT/'docs'/'CHANGELOG.md').exists() else ''
CONF = {p.stem for p in (ROOT/'docs'/'conformance').glob('*.md')} if (ROOT/'docs'/'conformance').exists() else set()

problems = []
def bad(kind, msg): problems.append((kind, msg))

# ---- defined ids -------------------------------------------------------
def defined(prefix):
    return [m.group(1) for m in re.finditer(r'^- `('+prefix+r'-?\d+)`', SPEC, re.M)]
ids = {p: defined(p) for p in ('FR','NFR','I','K','O')}

for p, got in ids.items():
    seen = {}
    for x in got:
        seen[x] = seen.get(x, 0) + 1
    for x, n in seen.items():
        if n > 1: bad('duplicate-id', f'{x} defined {n} times')
    nums = sorted(int(re.search(r'\d+', x).group()) for x in set(got))
    if nums:
        missing = [n for n in range(1, max(nums)+1) if n not in nums]
        if missing: bad('numbering-gap', f'{p}: missing {", ".join(map(str, missing))}')

# ---- dangling references ----------------------------------------------
allids = {x for v in ids.values() for x in v}
for m in re.finditer(r'`((?:N?FR|[IKO])-?\d+)`', SPEC):
    ref = m.group(1)
    if re.match(r'^(FR|NFR|I|K|O)-?\d+$', ref) and ref not in allids:
        bad('dangling-ref', f'{ref} referenced but never defined')

# ---- word budget, read from the spec itself ---------------------------
m = re.search(r'under ([\d,]+) words', SPEC)
if m:
    budget = int(m.group(1).replace(',', ''))
    words = len(SPEC.split())
    if words > budget: bad('over-budget', f'{words} words > M5 budget of {budget}')

# ---- every invariant should be guarded by some check ------------------
kblock = SPEC[SPEC.index('### §K'):] if '### §K' in SPEC else ''
for inv in ids['I']:
    if inv not in kblock: bad('unguarded-invariant', f'{inv} is referenced by no §K check')

# ---- §T values must match the build's CONFIG --------------------------
m = re.search(r'Current values: (.+?)\n', SPEC, re.S)
cfg = dict(re.findall(r'(\w+)\s*:\s*([\d.]+)', BUILD[BUILD.find('var CONFIG'):BUILD.find('var CONTACTS')])) if 'var CONFIG' in BUILD else {}
ALIAS = {'firewall':'firewall','RAM':'ram','breach damage':'breach','breach growth':'breachGrowth',
         'repair':'repair','roster cap':'rosterCap','trace max':'traceMax','trace per turn':'tracePerTurn',
         'layers':'layers','offers per layer':'offers'}
if m and cfg:
    for label, key in ALIAS.items():
        mm = re.search(re.escape(label)+r' (\d+)', m.group(1))
        if mm and key in cfg and mm.group(1) != cfg[key]:
            bad('spec-build-drift', f'§T says {label} {mm.group(1)}, CONFIG.{key} is {cfg[key]}')

# ---- version bookkeeping ----------------------------------------------
ver = re.search(r'\*\*Version:\*\* ([\d.]+)', SPEC)
if ver:
    v = ver.group(1)
    if LOG and f'- `{v}`' not in LOG: bad('missing-changelog', f'version {v} has no CHANGELOG entry')
    if CONF and v not in CONF: bad('missing-conformance', f'version {v} has no docs/conformance/{v}.md')

for kind, msg in problems: print(f'{kind}: {msg}')
print(f'\n{len(problems)} problem(s)' if problems else '\nclean')
sys.exit(1 if problems else 0)
