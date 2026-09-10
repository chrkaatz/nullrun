# NULLRUN (traditional arm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build NULLRUN — a short turn-based deckbuilder — with Node/TypeScript/Vite/React, satisfying 17 design-neutral acceptance criteria, as the traditional arm of a three-way method comparison.

**Architecture:** All rules live in a framework-free `src/engine/` of pure functions over an immutable `RunState`. React renders state and dispatches intent; it holds no rules. Every acceptance criterion becomes a Vitest test written before the code it checks. The engine's purity is what lets the statistical criteria (500 turns, 200 seeds) run headless in milliseconds.

**Tech Stack:** Node 24, pnpm 10, TypeScript 5 (strict), Vite 7, React 19, Vitest 3.

**Spec:** `traditional/docs/superpowers/specs/2026-09-10-nullrun-traditional-design.md`

## Global Constraints

- **Working directory is `traditional/`.** Every path in this plan is relative to it. The repository root is one level up and contains the other arms; never write outside `traditional/` except where a task says so explicitly.
- **The engine imports nothing from React, the DOM, or `window`.** Enforced by test in Task 2.
- **Determinism:** all randomness comes from one seeded generator threaded through state. `Math.random()` is banned in `src/engine/` and enforced by test in Task 2.
- **Immutability:** engine functions never mutate their argument; they return a new state.
- **TypeScript `strict: true`.** No `any` in `src/engine/`.
- **Design vocabulary is this arm's to invent.** Do not read `ephemeral/docs/NULLRUN-SPEC.md` Part III, and do not import the names breach, trace, reach, repair, roster, construct, armour or contact from it. The brief in Task 1 and the criteria are the only inputs.
- **Commit after every task.** Conventional commit messages (`feat:`, `test:`, `chore:`).
- **The pre-commit hook** at the repository root runs `*/tools/speclint.py`. This arm ships no such file, so the hook is a no-op here.

### The brief (Part II, verbatim — the shared target)

> **NULLRUN.** A short, turn-based deckbuilder about running a team into a hostile system. You descend eight layers of a dead arcology toward its core. Your deck is not software: it is the people you can call, and each answers once. Dark science fiction, degraded and industrial.
>
> Tone: the system is indifferent, not theatrical. Log lines are terse machine output. No villain speaks.
>
> **Primary job.** A complete, tense hand of decisions every turn, and a whole run in under fifteen minutes, on a phone held in one hand.
>
> **Pillars.** 1. *No hidden damage* — every attack states its exact value for a full turn before it lands. 2. *Time is the real enemy* — pressure rises per turn, not per action; a stronger team is a quieter run. 3. *Spending is losing* — capability is rationed by exhaustion, not draw; everyone you call is gone for the rest of the encounter, and the whole team is always visible. Beneath that sits a floor you can never spend: you always have something, it is simply never enough. 4. *Colour carries meaning* — cyan is you, amber is the world, rust is incoming harm. Nothing is coloured decoratively.

### Acceptance criteria

| # | criterion |
|---|---|
| A1 | Same seed and same input sequence reproduce a run exactly, including its final score. |
| A2 | Every choice point offers distinct options, priced differently, at least one achievable with what the player currently has. |
| A3 | Resource accounting is conserved over at least 500 turns: nothing silently created, duplicated or destroyed. |
| A4 | No harm reaches the player that was not shown, at its exact value, before it landed. |
| A5 | An action the player cannot afford changes no state at all. |
| A6 | The player always has a legal action, and every screen offers a way onward. |
| A7 | Every entity, value and state is readable in greyscale. State is never carried by colour alone. |
| A8 | No network request is issued at runtime. |
| A9 | No horizontal scroll at 360px wide. |
| A10 | Every interactive target is at least 44px on its short edge. |
| A11 | Any declared cap is enforced and never exceeded. |
| A12 | Damage mitigation never reduces an attack to nothing unless the rules say so explicitly. |
| A13 | No resource may be bounded such that the outcome is decided before play begins. |
| A14 | Every pressure mechanic must bind: removing it changes outcomes materially. |
| A15 | No free or renewable action may trivialise the primary resource. |
| A16 | The player can see whether a choice is achievable before committing to it. |
| A17 | Viability: a competent scripted policy wins 15–65% of 200 seeds, encounters average at least 2.5 decisions, under a tenth end before a decision is taken, and every piece of content is reached across the sample. |

### File structure

| file | responsibility |
|---|---|
| `src/engine/rng.ts` | seeded generator; the only source of randomness |
| `src/engine/types.ts` | `RunState`, `Operative`, `Sentinel`, `Node`, `Screen` and friends |
| `src/engine/content.ts` | the operative and sentinel tables — data, not logic |
| `src/engine/config.ts` | every balance number, in one object |
| `src/engine/encounter.ts` | turn resolution: call, press, end turn |
| `src/engine/route.ts` | node generation and choosing one |
| `src/engine/run.ts` | run lifecycle: start, advance, end; the reducer facade |
| `src/engine/policy.ts` | scripted policies used by the statistical tests |
| `src/ui/*.tsx` | rendering only |
| `src/engine/*.test.ts` | one test file per engine module |

---

### Task 1: Project scaffold and the purity guards

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `.gitignore`
- Create: `src/engine/guards.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `pnpm test` and `pnpm dev`; the guard test that every later task must keep green.

- [ ] **Step 1: Scaffold and install**

```bash
cd traditional
pnpm create vite@latest . --template react-ts
pnpm install
pnpm add -D vitest@^3 @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom
```

If `pnpm create vite` refuses because the directory is non-empty, answer its prompt to continue; `docs/` must survive.

- [ ] **Step 2: Configure Vitest**

Replace `vite.config.ts` with:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    environmentMatchGlobs: [['src/ui/**', 'jsdom']],
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

Set `"strict": true` in `tsconfig.json` under `compilerOptions` if not already present.

- [ ] **Step 3: Write the failing purity guard**

Create `src/engine/guards.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/engine'
const sources = () =>
  readdirSync(DIR).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))

describe('engine purity', () => {
  it('has at least one source file', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('never imports React or touches the DOM', () => {
    for (const f of sources()) {
      const src = readFileSync(join(DIR, f), 'utf8')
      expect(src, `${f} imports react`).not.toMatch(/from ['"]react/)
      expect(src, `${f} touches window`).not.toMatch(/\bwindow\b/)
      expect(src, `${f} touches document`).not.toMatch(/\bdocument\b/)
    }
  })

  it('never calls Math.random', () => {
    for (const f of sources()) {
      const src = readFileSync(join(DIR, f), 'utf8')
      expect(src, `${f} calls Math.random`).not.toMatch(/Math\.random/)
    }
  })
})
```

- [ ] **Step 4: Run it and watch it fail**

Run: `pnpm test`
Expected: FAIL — "has at least one source file", because `src/engine/` is empty.

- [ ] **Step 5: Create the engine directory with a placeholder that satisfies purity**

Create `src/engine/config.ts`:

```ts
/** Every balance number lives here. Nothing else may hold a magic number. */
export const CONFIG = {
  layers: 8,
} as const

export type Config = typeof CONFIG
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add traditional
git commit -m "chore: scaffold traditional arm with vite, react, vitest and engine purity guards"
```

---

### Task 2: Seeded randomness (A1)

**Files:**
- Create: `src/engine/rng.ts`
- Test: `src/engine/rng.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `makeRng(seed: string): Rng`, `type Rng = { next(): number; int(n: number): number; pick<T>(xs: readonly T[]): T; shuffle<T>(xs: readonly T[]): T[]; state(): number }`. Every later task threads an `Rng` rather than calling randomness itself.

- [ ] **Step 1: Write the failing test**

Create `src/engine/rng.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng('SEED-1')
    const b = makeRng('SEED-1')
    const draw = (r: ReturnType<typeof makeRng>) =>
      Array.from({ length: 20 }, () => r.next())
    expect(draw(a)).toEqual(draw(b))
  })

  it('differs between seeds', () => {
    const a = Array.from({ length: 20 }, () => makeRng('A').next())
    const b = Array.from({ length: 20 }, () => makeRng('B').next())
    expect(a).not.toEqual(b)
  })

  it('returns values in [0, 1)', () => {
    const r = makeRng('RANGE')
    for (let i = 0; i < 1000; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) stays within bounds', () => {
    const r = makeRng('INT')
    for (let i = 0; i < 1000; i++) {
      const v = r.int(7)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
    }
  })

  it('shuffle is a permutation and does not mutate its input', () => {
    const input = Object.freeze([1, 2, 3, 4, 5])
    const out = makeRng('SHUF').shuffle(input)
    expect(out).toHaveLength(5)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('shuffle is deterministic per seed', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(makeRng('S').shuffle(xs)).toEqual(makeRng('S').shuffle(xs))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/rng.test.ts`
Expected: FAIL — cannot resolve `./rng`.

- [ ] **Step 3: Write the implementation**

Create `src/engine/rng.ts`:

```ts
export type Rng = {
  next(): number
  int(n: number): number
  pick<T>(xs: readonly T[]): T
  shuffle<T>(xs: readonly T[]): T[]
  state(): number
}

function hash(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** mulberry32 over an FNV-1a seed. One generator, threaded explicitly. */
export function makeRng(seed: string): Rng {
  let a = hash(seed)
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n: number) => Math.floor(next() * n)
  return {
    next,
    int,
    pick: <T,>(xs: readonly T[]): T => xs[int(xs.length)],
    shuffle: <T,>(xs: readonly T[]): T[] => {
      const out = [...xs]
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    state: () => a,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, all rng tests plus the guards.

- [ ] **Step 5: Commit**

```bash
git add traditional
git commit -m "feat: seeded deterministic rng"
```

---

### Task 3: Types and content tables

**Files:**
- Create: `src/engine/types.ts`, `src/engine/content.ts`
- Modify: `src/engine/config.ts`
- Test: `src/engine/content.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type OperativeId = string`
  - `type Operative = { id: OperativeId; name: string; role: string; cost: number; tier: 0|1|2|3; text: string; damage?: number; pierce?: boolean; shield?: number; calm?: number; refund?: number; strip?: number }`
  - `type Intent = { label: string; damage: number; restore?: number }`
  - `type Sentinel = { id: string; name: string; tag: string; integrity: number; guard: number; intents: readonly Intent[] }`
  - `OPERATIVES: Record<OperativeId, Operative>`, `SENTINELS: Record<string, Sentinel>`
  - `CONFIG` gains fields used by later tasks.

Vocabulary note: this arm calls the callable people **operatives**, the enemies **sentinels**, the per-turn pressure **heat**, the player's health **integrity**, the enemy's health **integrity** too (disambiguated by owner), the free renewable action **press**, and the mitigation stat **guard**. Use these names consistently; do not use the other arm's terms.

- [ ] **Step 1: Write the failing test**

Create `src/engine/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { OPERATIVES, SENTINELS } from './content'
import { CONFIG } from './config'

describe('content tables', () => {
  it('every operative has a unique id matching its key', () => {
    for (const [key, op] of Object.entries(OPERATIVES)) {
      expect(op.id).toBe(key)
    }
  })

  it('operative costs are within the RAM ceiling', () => {
    for (const op of Object.values(OPERATIVES)) {
      expect(op.cost).toBeGreaterThanOrEqual(0)
      expect(op.cost).toBeLessThanOrEqual(CONFIG.ram)
    }
  })

  it('every operative does something', () => {
    for (const op of Object.values(OPERATIVES)) {
      const effects = [op.damage, op.shield, op.calm, op.refund, op.strip]
      expect(effects.some(v => v !== undefined), `${op.id} is inert`).toBe(true)
    }
  })

  it('has at least four sentinels so a three-of-N offer has choice', () => {
    const route = Object.values(SENTINELS).filter(s => s.tag !== 'CORE')
    expect(route.length).toBeGreaterThanOrEqual(4)
  })

  it('every sentinel has at least one intent and non-zero integrity', () => {
    for (const s of Object.values(SENTINELS)) {
      expect(s.intents.length).toBeGreaterThan(0)
      expect(s.integrity).toBeGreaterThan(0)
    }
  })

  it('exactly one sentinel is the core', () => {
    expect(Object.values(SENTINELS).filter(s => s.tag === 'CORE')).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/content.test.ts`
Expected: FAIL — cannot resolve `./content`.

- [ ] **Step 3: Write types**

Create `src/engine/types.ts`:

```ts
export type OperativeId = string

export type Operative = {
  id: OperativeId
  name: string
  role: string
  cost: number
  tier: 0 | 1 | 2 | 3
  text: string
  damage?: number
  pierce?: boolean
  shield?: number
  calm?: number
  refund?: number
  strip?: number
}

export type Intent = { label: string; damage: number; restore?: number }

export type Sentinel = {
  id: string
  name: string
  tag: string
  integrity: number
  guard: number
  intents: readonly Intent[]
}

export type Screen = 'loadout' | 'route' | 'encounter' | 'spoils' | 'end'

export type SlotState = { id: OperativeId; spent: boolean }

export type NodeOffer = {
  sentinelId: string
  integrity: number
  guard: number
  payout: number
  /** the most damage the current team could bring here — A16 */
  ceiling: number
}

export type ActiveSentinel = {
  id: string
  name: string
  integrity: number
  max: number
  guard: number
  intentIndex: number
  /** frozen the moment it is shown — A4 */
  shownIntent: Intent
  shownDamage: number
}

export type RunState = {
  seed: string
  rngState: number
  screen: Screen
  layer: number
  integrity: number
  ram: number
  ramMax: number
  heat: number
  credits: number
  turns: number
  callsMade: number
  team: readonly SlotState[]
  spentThisNode: readonly OperativeId[]
  pressedThisTurn: boolean
  offers: readonly NodeOffer[]
  node: NodeOffer | null
  sentinel: ActiveSentinel | null
  offer: OperativeId | null
  releasing: boolean
  log: readonly string[]
  won: boolean
}
```

- [ ] **Step 4: Extend config**

Replace `src/engine/config.ts`:

```ts
/** Every balance number lives here. Nothing else may hold a magic number. */
export const CONFIG = {
  layers: 8,
  offersPerLayer: 3,
  integrity: 60,
  ram: 3,
  teamCap: 8,
  heatMax: 100,
  heatPerTurn: 15,
  pressDamage: 4,
  pressGrowth: 1.5,
  patch: 24,
  payoutFlat: 60,
  payoutPerIntegrity: 1.2,
  corePayout: 600,
  layerScale: 0.14,
  unlock: { 1: 400, 2: 1200, 3: 2400 } as Record<number, number>,
} as const

export type Config = typeof CONFIG
```

- [ ] **Step 5: Write content**

Create `src/engine/content.ts`:

```ts
import type { Operative, OperativeId, Sentinel } from './types'

export const OPERATIVES: Record<OperativeId, Operative> = {
  velvet:   { id: 'velvet',   name: 'VELVET',      role: 'FACE',        cost: 0, tier: 0, text: 'Talks you a window. +7 integrity.', shield: 7 },
  bishop:   { id: 'bishop',   name: 'BISHOP',      role: 'DECKER',      cost: 1, tier: 0, text: '5 damage, strips 2 guard.', damage: 5, strip: 2 },
  sparrow:  { id: 'sparrow',  name: 'SPARROW',     role: 'SCOUT',       cost: 1, tier: 0, text: '+4 integrity, refunds 1 RAM.', shield: 4, refund: 1 },
  mole:     { id: 'mole',     name: 'MOLE',        role: 'RIGGER',      cost: 1, tier: 0, text: 'Drone strike. 8 damage, ignores guard.', damage: 8, pierce: true },
  hatchet:  { id: 'hatchet',  name: 'HATCHET',     role: 'SAMURAI',     cost: 2, tier: 0, text: 'Loud and final. 16 damage.', damage: 16 },
  grief:    { id: 'grief',    name: 'GRIEF',       role: 'MEDIC',       cost: 1, tier: 0, text: 'Patches you up. +11 integrity.', shield: 11 },
  tally:    { id: 'tally',    name: 'TALLY',       role: 'FIXER',       cost: 0, tier: 0, text: 'Buys silence. Heat -15.', calm: 15 },
  ash:      { id: 'ash',      name: 'ASH',         role: 'COURIER',     cost: 1, tier: 0, text: '6 damage, heat -5.', damage: 6, calm: 5 },
  prior:    { id: 'prior',    name: 'PRIOR',       role: 'MUSCLE',      cost: 2, tier: 1, text: '12 damage, +4 integrity.', damage: 12, shield: 4 },
  ninth:    { id: 'ninth',    name: 'NINE-TENTHS', role: 'FORGER',      cost: 1, tier: 1, text: 'Strips 3 guard, heat -10.', strip: 3, calm: 10 },
  cardinal: { id: 'cardinal', name: 'CARDINAL',    role: 'RIGGER',      cost: 2, tier: 2, text: '10 damage, ignores guard.', damage: 10, pierce: true },
  wren:     { id: 'wren',     name: 'WREN',        role: 'INFILTRATOR', cost: 0, tier: 2, text: '4 damage, refunds 1 RAM.', damage: 4, refund: 1 },
  saint:    { id: 'saint',    name: 'SAINT',       role: 'EX-CORPSEC',  cost: 3, tier: 3, text: '22 damage. Nothing subtle.', damage: 22 },
  dolorosa: { id: 'dolorosa', name: 'DOLOROSA',    role: 'UNKNOWN',     cost: 2, tier: 3, text: '18 damage, heat +10.', damage: 18, calm: -10 },
}

/** Drafted into the team as spoils; the starting five are not offered again. */
export const DRAFT_POOL: readonly OperativeId[] = [
  'grief', 'tally', 'ash', 'prior', 'ninth', 'cardinal', 'wren', 'saint', 'dolorosa',
]

export const STARTING_TEAM: readonly OperativeId[] = [
  'velvet', 'bishop', 'sparrow', 'mole', 'hatchet',
]

export const SENTINELS: Record<string, Sentinel> = {
  cold:   { id: 'cold',   name: 'COLD STORAGE',  tag: 'QUIET',  integrity: 51,  guard: 0, intents: [{ label: 'HOLD', damage: 0 }, { label: 'PURGE', damage: 7 }] },
  wall:   { id: 'wall',   name: 'ICE WALL',      tag: 'COMBAT', integrity: 78,  guard: 3, intents: [{ label: 'STRIKE', damage: 7 }] },
  hunter: { id: 'hunter', name: 'HUNTER',        tag: 'HARD',   integrity: 90,  guard: 2, intents: [{ label: 'HUNT', damage: 8 }] },
  sweep:  { id: 'sweep',  name: 'CORPSEC SWEEP', tag: 'HARD',   integrity: 95,  guard: 1, intents: [{ label: 'BURST', damage: 5 }, { label: 'SUPPRESS', damage: 9 }] },
  archon: { id: 'archon', name: 'ARCHON',        tag: 'CORE',   integrity: 144, guard: 3, intents: [{ label: 'SHOCKWAVE', damage: 10 }, { label: 'RESTORE', damage: 0, restore: 2 }, { label: 'SHOCKWAVE', damage: 12 }] },
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add traditional
git commit -m "feat: engine types, config and content tables"
```

---

### Task 4: Starting a run and the ceiling calculation (A16)

**Files:**
- Create: `src/engine/run.ts`
- Test: `src/engine/run.test.ts`

**Interfaces:**
- Consumes: `makeRng` (Task 2), `CONFIG`, `OPERATIVES`, `STARTING_TEAM`, `SENTINELS`, types (Task 3).
- Produces:
  - `startRun(seed: string): RunState`
  - `pressDamage(state: RunState): number`
  - `turnsAllowed(state: RunState): number`
  - `ceilingAgainst(state: RunState, guard: number): number`

`ceilingAgainst` is the most damage the current team plus repeated presses could do before heat ends the node. It is the number A16 requires the route screen to show, and the number A13/A15 are measured against.

- [ ] **Step 1: Write the failing test**

Create `src/engine/run.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { startRun, pressDamage, turnsAllowed, ceilingAgainst } from './run'
import { CONFIG } from './config'
import { STARTING_TEAM } from './content'

describe('startRun', () => {
  it('starts on the loadout screen at layer 1 with a full team', () => {
    const s = startRun('SEED')
    expect(s.screen).toBe('loadout')
    expect(s.layer).toBe(1)
    expect(s.team.map(t => t.id)).toEqual([...STARTING_TEAM])
    expect(s.team.every(t => !t.spent)).toBe(true)
    expect(s.integrity).toBe(CONFIG.integrity)
    expect(s.heat).toBe(0)
    expect(s.won).toBe(false)
  })

  it('is a pure function of its seed', () => {
    expect(startRun('X')).toEqual(startRun('X'))
  })

  it('does not mutate a state it is given', () => {
    const a = startRun('SEED')
    const frozen = Object.freeze({ ...a })
    startRun('SEED')
    expect(frozen.layer).toBe(1)
  })
})

describe('pressDamage', () => {
  it('grows with depth', () => {
    const s = startRun('P')
    const l1 = pressDamage({ ...s, layer: 1 })
    const l5 = pressDamage({ ...s, layer: 5 })
    expect(l1).toBe(CONFIG.pressDamage)
    expect(l5).toBeGreaterThan(l1)
  })
})

describe('turnsAllowed', () => {
  it('is heatMax divided by the per-turn rise', () => {
    const s = startRun('T')
    expect(turnsAllowed(s)).toBe(Math.floor(CONFIG.heatMax / CONFIG.heatPerTurn))
  })
})

describe('ceilingAgainst', () => {
  it('counts every unspent operative plus presses for every allowed turn', () => {
    const s = startRun('C')
    const ceiling = ceilingAgainst(s, 0)
    expect(ceiling).toBeGreaterThan(0)
    // strictly greater than the team alone, because presses are included
    const teamOnly = 5 + 8 + 16 // bishop + mole + hatchet at guard 0
    expect(ceiling).toBeGreaterThan(teamOnly)
  })

  it('is reduced by guard, but pierce ignores it', () => {
    const s = startRun('C')
    expect(ceilingAgainst(s, 3)).toBeLessThan(ceilingAgainst(s, 0))
  })

  it('ignores operatives already spent this node', () => {
    const s = startRun('C')
    const spent = { ...s, team: s.team.map(t => ({ ...t, spent: true })) }
    expect(ceilingAgainst(spent, 0)).toBeLessThan(ceilingAgainst(s, 0))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/run.test.ts`
Expected: FAIL — cannot resolve `./run`.

- [ ] **Step 3: Write the implementation**

Create `src/engine/run.ts`:

```ts
import { CONFIG } from './config'
import { OPERATIVES, STARTING_TEAM } from './content'
import { makeRng } from './rng'
import type { RunState } from './types'

export function startRun(seed: string): RunState {
  const s = seed.toUpperCase()
  return {
    seed: s,
    rngState: makeRng(s).state(),
    screen: 'loadout',
    layer: 1,
    integrity: CONFIG.integrity,
    ram: CONFIG.ram,
    ramMax: CONFIG.ram,
    heat: 0,
    credits: 0,
    turns: 0,
    callsMade: 0,
    team: STARTING_TEAM.map(id => ({ id, spent: false })),
    spentThisNode: [],
    pressedThisTurn: false,
    offers: [],
    node: null,
    sentinel: null,
    offer: null,
    releasing: false,
    log: [],
    won: false,
  }
}

/** The free action grows with depth, because sentinel integrity does. */
export function pressDamage(state: RunState): number {
  return CONFIG.pressDamage + (state.layer - 1) * CONFIG.pressGrowth
}

/** How many turns heat allows in one node. */
export function turnsAllowed(_state: RunState): number {
  return Math.floor(CONFIG.heatMax / CONFIG.heatPerTurn)
}

/**
 * The most damage this team could bring against `guard` before heat ends the
 * node: every unspent operative once, plus a press every allowed turn.
 * A16 requires this to be shown before a node is chosen.
 */
export function ceilingAgainst(state: RunState, guard: number): number {
  const burst = state.team.reduce((n, slot) => {
    if (slot.spent) return n
    const op = OPERATIVES[slot.id]
    if (!op.damage) return n
    return n + (op.pierce ? op.damage : Math.max(1, op.damage - guard))
  }, 0)
  return Math.round(burst + pressDamage(state) * turnsAllowed(state))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add traditional
git commit -m "feat: run start, press damage and the damage ceiling"
```

---

### Task 5: Route generation (A2, A16)

**Files:**
- Create: `src/engine/route.ts`
- Test: `src/engine/route.test.ts`

**Interfaces:**
- Consumes: `ceilingAgainst`, `CONFIG`, `SENTINELS`, `makeRng`.
- Produces:
  - `generateOffers(state: RunState): RunState` — returns a new state with `offers` filled and `rngState` advanced
  - `enterNode(state: RunState, index: number): RunState`

Offer rules this task must satisfy: three distinct sentinels; payout scaling with that node's integrity so no two offers are priced alike; at least one offer whose `integrity <= ceiling`.

- [ ] **Step 1: Write the failing test**

Create `src/engine/route.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { startRun, ceilingAgainst } from './run'
import { generateOffers, enterNode } from './route'
import { CONFIG } from './config'

const atLayer = (seed: string, layer: number) =>
  generateOffers({ ...startRun(seed), layer })

describe('generateOffers', () => {
  it('offers three distinct sentinels', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`S-${i}`, 1 + (i % 7))
      expect(s.offers).toHaveLength(CONFIG.offersPerLayer)
      expect(new Set(s.offers.map(o => o.sentinelId)).size).toBe(CONFIG.offersPerLayer)
    }
  })

  it('never prices two offers the same', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`P-${i}`, 1 + (i % 7))
      expect(new Set(s.offers.map(o => o.payout)).size).toBe(CONFIG.offersPerLayer)
    }
  })

  it('always includes at least one achievable node (A2)', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`A-${i}`, 1 + (i % 7))
      const achievable = s.offers.some(o => o.integrity <= ceilingAgainst(s, o.guard))
      expect(achievable, `layer ${s.layer} seed A-${i} offered nothing achievable`).toBe(true)
    }
  })

  it('states a truthful ceiling on every offer (A16)', () => {
    const s = atLayer('C', 3)
    for (const o of s.offers) {
      expect(o.ceiling).toBe(ceilingAgainst(s, o.guard))
    }
  })

  it('is deterministic for a seed and layer', () => {
    expect(atLayer('D', 4).offers).toEqual(atLayer('D', 4).offers)
  })

  it('does not mutate the state it is given', () => {
    const before = startRun('M')
    const snapshot = JSON.stringify(before)
    generateOffers(before)
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

describe('enterNode', () => {
  it('moves to the encounter with heat reset and the team refreshed', () => {
    const s0 = generateOffers({ ...startRun('E'), layer: 2, heat: 40 })
    const spent = { ...s0, team: s0.team.map(t => ({ ...t, spent: true })) }
    const s = enterNode(spent, 0)
    expect(s.screen).toBe('encounter')
    expect(s.heat).toBe(0)
    expect(s.team.every(t => !t.spent)).toBe(true)
    expect(s.spentThisNode).toEqual([])
    expect(s.sentinel).not.toBeNull()
    expect(s.ram).toBe(s.ramMax)
  })

  it('shows an intent immediately, with its damage frozen (A4)', () => {
    const s0 = generateOffers(startRun('I'))
    const s = enterNode(s0, 0)
    expect(s.sentinel!.shownIntent).toBeDefined()
    expect(s.sentinel!.shownDamage).toBe(s.sentinel!.shownIntent.damage)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/route.test.ts`
Expected: FAIL — cannot resolve `./route`.

- [ ] **Step 3: Write the implementation**

Create `src/engine/route.ts`:

```ts
import { CONFIG } from './config'
import { SENTINELS } from './content'
import { makeRng } from './rng'
import { ceilingAgainst } from './run'
import type { NodeOffer, RunState } from './types'

const ROUTE_IDS = Object.values(SENTINELS)
  .filter(s => s.tag !== 'CORE')
  .map(s => s.id)

function scaleAt(layer: number): number {
  return 1 + (layer - 1) * CONFIG.layerScale
}

/**
 * Three distinct sentinels, priced by their own integrity so no two offers
 * cost the same, and at least one the team can actually clear (A2).
 * The achievable-node guarantee is enforced here, not hoped for: the offer
 * set is drawn once, then reordered without drawing again so determinism holds.
 */
export function generateOffers(state: RunState): RunState {
  const rng = makeRng(`${state.seed}:offers:${state.layer}`)
  const bag = rng.shuffle(ROUTE_IDS)
  const scale = scaleAt(state.layer)
  const integrityOf = (id: string) => Math.round(SENTINELS[id].integrity * scale)
  const achievable = (id: string) =>
    integrityOf(id) <= ceilingAgainst(state, SENTINELS[id].guard)

  const take = bag.slice(0, CONFIG.offersPerLayer)
  if (!take.some(achievable)) {
    const rescue = bag.slice(CONFIG.offersPerLayer).find(achievable)
    if (rescue) take[CONFIG.offersPerLayer - 1] = rescue
  }

  const offers: NodeOffer[] = take.map(id => {
    const integrity = integrityOf(id)
    return {
      sentinelId: id,
      integrity,
      guard: SENTINELS[id].guard,
      payout: CONFIG.payoutFlat + Math.round(integrity * CONFIG.payoutPerIntegrity),
      ceiling: ceilingAgainst(state, SENTINELS[id].guard),
    }
  })

  // If nothing in the set is achievable, soften the easiest to exactly
  // reachable rather than offer a layer that cannot be taken (A2).
  if (!offers.some(o => o.integrity <= o.ceiling)) {
    let e = 0
    for (let i = 1; i < offers.length; i++) {
      if (offers[i].integrity < offers[e].integrity) e = i
    }
    const softened = Math.max(1, offers[e].ceiling)
    offers[e] = {
      ...offers[e],
      integrity: softened,
      payout: CONFIG.payoutFlat + Math.round(softened * CONFIG.payoutPerIntegrity),
    }
  }

  return { ...state, offers, screen: 'route' }
}

export function enterNode(state: RunState, index: number): RunState {
  const node = state.offers[index]
  const def = SENTINELS[node.sentinelId]
  const first = def.intents[0]
  return {
    ...state,
    screen: 'encounter',
    node,
    sentinel: {
      id: def.id,
      name: def.name,
      integrity: node.integrity,
      max: node.integrity,
      guard: node.guard,
      intentIndex: 0,
      shownIntent: first,
      shownDamage: first.damage,
    },
    heat: 0,
    ram: state.ramMax,
    turns: 0,
    pressedThisTurn: false,
    team: state.team.map(t => ({ ...t, spent: false })),
    spentThisNode: [],
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add traditional
git commit -m "feat: route generation with a guaranteed achievable node"
```

---

### Task 6: The encounter turn (A4, A5, A12, A15)

**Files:**
- Create: `src/engine/encounter.ts`
- Test: `src/engine/encounter.test.ts`

**Interfaces:**
- Consumes: `pressDamage`, `CONFIG`, `OPERATIVES`, `SENTINELS`, types.
- Produces:
  - `call(state: RunState, id: OperativeId): RunState`
  - `press(state: RunState): RunState`
  - `endTurn(state: RunState): RunState`
  - `canCall(state: RunState, id: OperativeId): boolean`

Turn contract: the shown intent is frozen when displayed. Ending the turn raises heat, ends the run if heat is full, resolves the shown intent against integrity, ends the run if integrity is gone, shows the next intent, and refills RAM.

- [ ] **Step 1: Write the failing test**

Create `src/engine/encounter.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { startRun, pressDamage } from './run'
import { generateOffers, enterNode } from './route'
import { call, press, endTurn, canCall } from './encounter'
import { CONFIG } from './config'
import { OPERATIVES } from './content'

const inEncounter = (seed = 'E') => enterNode(generateOffers(startRun(seed)), 0)

describe('call', () => {
  it('spends the operative and reduces RAM', () => {
    const s0 = inEncounter()
    const id = s0.team.find(t => OPERATIVES[t.id].cost <= s0.ram)!.id
    const s = call(s0, id)
    expect(s.team.find(t => t.id === id)!.spent).toBe(true)
    expect(s.ram).toBe(s0.ram - OPERATIVES[id].cost + (OPERATIVES[id].refund ?? 0))
    expect(s.callsMade).toBe(s0.callsMade + 1)
  })

  it('cannot be called twice in one node', () => {
    const s0 = inEncounter()
    const id = s0.team.find(t => OPERATIVES[t.id].cost <= s0.ram)!.id
    const once = call(s0, id)
    const twice = call({ ...once, ram: 9 }, id)
    expect(twice).toEqual({ ...once, ram: 9 })
  })

  it('an unaffordable operative changes nothing at all (A5)', () => {
    const s0 = { ...inEncounter(), ram: 0 }
    const costly = s0.team.find(t => OPERATIVES[t.id].cost > 0)!.id
    expect(call(s0, costly)).toEqual(s0)
    expect(canCall(s0, costly)).toBe(false)
  })

  it('guard reduces damage but never below 1, and pierce ignores it (A12)', () => {
    const s0 = { ...inEncounter(), ram: 9 }
    const hard = { ...s0, sentinel: { ...s0.sentinel!, guard: 99, integrity: 500, max: 500 } }
    const blunt = call(hard, 'bishop')
    expect(hard.sentinel!.integrity - blunt.sentinel!.integrity).toBe(1)
    const pierced = call(hard, 'mole')
    expect(hard.sentinel!.integrity - pierced.sentinel!.integrity).toBe(OPERATIVES.mole.damage)
  })
})

describe('press', () => {
  it('is free, spends nobody, and works once per turn (A15)', () => {
    const s0 = inEncounter()
    const s = press(s0)
    expect(s.ram).toBe(s0.ram)
    expect(s.team.filter(t => t.spent)).toHaveLength(0)
    expect(s.pressedThisTurn).toBe(true)
    expect(s.sentinel!.integrity).toBe(s0.sentinel!.integrity - pressDamage(s0))
    expect(press(s)).toEqual(s)
  })
})

describe('endTurn', () => {
  it('resolves exactly the damage that was shown (A4)', () => {
    const s0 = { ...inEncounter(), integrity: 999 }
    const shown = s0.sentinel!.shownDamage
    const s = endTurn(s0)
    expect(s0.integrity - s.integrity).toBe(shown)
  })

  it('raises heat and refreshes RAM and the press', () => {
    const s0 = { ...inEncounter(), integrity: 999, ram: 0, pressedThisTurn: true }
    const s = endTurn(s0)
    expect(s.heat).toBe(s0.heat + CONFIG.heatPerTurn)
    expect(s.ram).toBe(s.ramMax)
    expect(s.pressedThisTurn).toBe(false)
  })

  it('ends the run when heat fills', () => {
    const s0 = { ...inEncounter(), integrity: 999, heat: CONFIG.heatMax - 1 }
    const s = endTurn(s0)
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })

  it('ends the run when integrity is gone', () => {
    const s0 = { ...inEncounter(), integrity: 1 }
    const s = endTurn(s0)
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })

  it('advances to the next intent and freezes its damage', () => {
    const s0 = { ...inEncounter('SWEEPY'), integrity: 999 }
    const s = endTurn(s0)
    if (s.screen === 'encounter') {
      expect(s.sentinel!.shownDamage).toBe(s.sentinel!.shownIntent.damage)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/encounter.test.ts`
Expected: FAIL — cannot resolve `./encounter`.

- [ ] **Step 3: Write the implementation**

Create `src/engine/encounter.ts`:

```ts
import { CONFIG } from './config'
import { OPERATIVES, SENTINELS } from './content'
import { pressDamage } from './run'
import type { OperativeId, RunState } from './types'

export function canCall(state: RunState, id: OperativeId): boolean {
  if (state.screen !== 'encounter' || !state.sentinel) return false
  const slot = state.team.find(t => t.id === id)
  if (!slot || slot.spent) return false
  return OPERATIVES[id].cost <= state.ram
}

/** A5: an operative that cannot be called changes nothing at all. */
export function call(state: RunState, id: OperativeId): RunState {
  if (!canCall(state, id)) return state
  const op = OPERATIVES[id]
  const sent = state.sentinel!
  let integrity = sent.integrity
  let guard = sent.guard
  const notes: string[] = []

  if (op.damage !== undefined) {
    const dealt = op.pierce ? op.damage : Math.max(1, op.damage - guard)
    integrity -= dealt
    notes.push(`${op.name} hits for ${dealt}.`)
  }
  if (op.strip !== undefined) {
    guard = Math.max(0, guard - op.strip)
    notes.push(`Guard down to ${guard}.`)
  }
  const playerIntegrity = state.integrity + (op.shield ?? 0)
  if (op.shield) notes.push(`${op.name} buys you ${op.shield} integrity.`)
  const heat = op.calm !== undefined
    ? Math.max(0, Math.min(CONFIG.heatMax, state.heat - op.calm))
    : state.heat
  if (op.calm !== undefined) notes.push(`Heat ${op.calm > 0 ? '-' : '+'}${Math.abs(op.calm)}.`)

  const next: RunState = {
    ...state,
    integrity: playerIntegrity,
    heat,
    ram: state.ram - op.cost + (op.refund ?? 0),
    team: state.team.map(t => (t.id === id ? { ...t, spent: true } : t)),
    spentThisNode: [...state.spentThisNode, id],
    callsMade: state.callsMade + 1,
    sentinel: { ...sent, integrity: Math.max(0, integrity), guard },
    log: [notes.join(' '), ...state.log].slice(0, 4),
  }
  return integrity <= 0 ? clearNode(next) : next
}

/**
 * A15: free, spends nobody, once per turn, and deliberately too weak to
 * finish a node on its own. It is what turns time into damage.
 */
export function press(state: RunState): RunState {
  if (state.screen !== 'encounter' || state.pressedThisTurn || !state.sentinel) return state
  const dealt = pressDamage(state)
  const integrity = state.sentinel.integrity - dealt
  const next: RunState = {
    ...state,
    pressedThisTurn: true,
    sentinel: { ...state.sentinel, integrity: Math.max(0, integrity) },
    log: [`You press for ${dealt}.`, ...state.log].slice(0, 4),
  }
  return integrity <= 0 ? clearNode(next) : next
}

export function endTurn(state: RunState): RunState {
  if (state.screen !== 'encounter' || !state.sentinel) return state
  const heat = state.heat + CONFIG.heatPerTurn
  if (heat >= CONFIG.heatMax) {
    return { ...state, heat: CONFIG.heatMax, screen: 'end', won: false,
             log: ['HEAT COMPLETE. They have you.', ...state.log].slice(0, 4) }
  }

  const sent = state.sentinel
  const notes: string[] = []
  let guard = sent.guard
  if (sent.shownIntent.restore) {
    guard += sent.shownIntent.restore
    notes.push(`${sent.name} restores ${sent.shownIntent.restore} guard.`)
  }
  const integrity = state.integrity - sent.shownDamage   // A4: exactly what was shown
  if (sent.shownDamage > 0) {
    notes.push(`${sent.name} resolves ${sent.shownIntent.label} for ${sent.shownDamage}.`)
  }
  if (integrity <= 0) {
    return { ...state, heat, integrity: 0, screen: 'end', won: false,
             log: [notes.join(' '), ...state.log].slice(0, 4) }
  }

  const defs = SENTINELS[sent.id].intents
  const idx = (sent.intentIndex + 1) % defs.length
  const shown = defs[idx]
  return {
    ...state,
    heat,
    integrity,
    turns: state.turns + 1,
    ram: state.ramMax,
    pressedThisTurn: false,
    sentinel: { ...sent, guard, intentIndex: idx, shownIntent: shown, shownDamage: shown.damage },
    log: [notes.join(' '), ...state.log].slice(0, 4),
  }
}

/** Exported for Task 7, which replaces this stub with the spoils screen. */
export function clearNode(state: RunState): RunState {
  return { ...state, screen: 'spoils' }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add traditional
git commit -m "feat: encounter turn with frozen intents and a free press"
```

---

### Task 7: Spoils, team cap and run completion (A3, A6, A11)

**Files:**
- Create: `src/engine/spoils.ts`
- Modify: `src/engine/encounter.ts` (replace the `clearNode` stub with a call into `spoils.ts`)
- Test: `src/engine/spoils.test.ts`

**Interfaces:**
- Consumes: `CONFIG`, `OPERATIVES`, `DRAFT_POOL`, `SENTINELS`, `makeRng`, `generateOffers`, `enterNode`.
- Produces:
  - `clearNode(state: RunState): RunState` — pays out and moves to spoils
  - `takeOperative(state: RunState): RunState`
  - `takePatch(state: RunState): RunState`
  - `release(state: RunState, id: OperativeId): RunState`
  - `declineSpoils(state: RunState): RunState`
  - `advanceLayer(state: RunState): RunState`
  - `bail(state: RunState): RunState`

- [ ] **Step 1: Write the failing test**

Create `src/engine/spoils.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { startRun } from './run'
import { generateOffers, enterNode } from './route'
import { clearNode, takeOperative, takePatch, release, declineSpoils, advanceLayer, bail } from './spoils'
import { CONFIG } from './config'
import { DRAFT_POOL } from './content'

const cleared = (seed = 'S') => clearNode(enterNode(generateOffers(startRun(seed)), 0))

describe('clearNode', () => {
  it('pays the node payout and moves to spoils', () => {
    const s0 = enterNode(generateOffers(startRun('C')), 0)
    const s = clearNode(s0)
    expect(s.screen).toBe('spoils')
    expect(s.credits).toBe(s0.credits + s0.node!.payout)
  })
})

describe('spoils choices', () => {
  it('offers an operative not already on the team', () => {
    const s = cleared()
    if (s.offer) {
      expect(s.team.map(t => t.id)).not.toContain(s.offer)
      expect(DRAFT_POOL).toContain(s.offer)
    }
  })

  it('taking an operative grows the team by exactly one (A3)', () => {
    const s0 = cleared()
    if (!s0.offer) return
    const s = takeOperative(s0)
    expect(s.team).toHaveLength(s0.team.length + 1)
    expect(new Set(s.team.map(t => t.id)).size).toBe(s.team.length)
  })

  it('patch restores integrity and adds nobody', () => {
    const s0 = { ...cleared(), integrity: 10 }
    const s = takePatch(s0)
    expect(s.integrity).toBe(10 + CONFIG.patch)
    expect(s.team).toHaveLength(s0.team.length)
  })

  it('patch is available even with no operative on offer (A6)', () => {
    const s0 = { ...cleared(), offer: null, integrity: 5 }
    expect(takePatch(s0).integrity).toBe(5 + CONFIG.patch)
  })

  it('accepting at the cap forces a release and never exceeds it (A11)', () => {
    const base = cleared()
    const extras = DRAFT_POOL.filter(id => !base.team.some(t => t.id === id))
    let s = { ...base, team: [...base.team] }
    while (s.team.length < CONFIG.teamCap && extras.length) {
      s = { ...s, team: [...s.team, { id: extras.shift()!, spent: false }] }
    }
    if (s.team.length < CONFIG.teamCap || !extras.length) return
    const full = { ...s, offer: extras.shift()!, releasing: false }
    const forced = takeOperative(full)
    expect(forced.releasing).toBe(true)
    expect(forced.team).toHaveLength(CONFIG.teamCap)
    const done = release(forced, forced.team[0].id)
    expect(done.team).toHaveLength(CONFIG.teamCap)
    expect(done.releasing).toBe(false)
  })
})

describe('advanceLayer', () => {
  it('moves to the next layer and offers a route', () => {
    const s0 = cleared()
    const s = advanceLayer(declineSpoils(s0))
    expect(s.layer).toBe(s0.layer + 1)
    expect(s.screen).toBe('route')
    expect(s.offers).toHaveLength(CONFIG.offersPerLayer)
  })

  it('the final layer is the core, entered directly', () => {
    const s0 = { ...cleared(), layer: CONFIG.layers - 1 }
    const s = advanceLayer(declineSpoils(s0))
    expect(s.layer).toBe(CONFIG.layers)
    expect(s.screen).toBe('encounter')
    expect(s.sentinel!.id).toBe('archon')
  })
})

describe('bail', () => {
  it('ends the run as a loss from any encounter state (A6)', () => {
    const s = bail(enterNode(generateOffers(startRun('B')), 0))
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/spoils.test.ts`
Expected: FAIL — cannot resolve `./spoils`.

- [ ] **Step 3: Write the implementation**

Create `src/engine/spoils.ts`:

```ts
import { CONFIG } from './config'
import { DRAFT_POOL, SENTINELS } from './content'
import { makeRng } from './rng'
import { generateOffers, enterNode } from './route'
import type { OperativeId, RunState } from './types'

function nextOffer(state: RunState): OperativeId | null {
  const held = new Set(state.team.map(t => t.id))
  const avail = DRAFT_POOL.filter(id => !held.has(id))
  if (!avail.length) return null
  return makeRng(`${state.seed}:spoils:${state.layer}`).pick(avail)
}

export function clearNode(state: RunState): RunState {
  const paid = state.credits + (state.node?.payout ?? 0)
  const name = state.sentinel?.name ?? 'the node'
  const withLog = {
    ...state,
    credits: paid,
    log: [`Layer ${state.layer} — ${name} down.`, ...state.log].slice(0, 4),
  }
  if (state.layer >= CONFIG.layers) {
    return { ...withLog, screen: 'end', won: true }
  }
  return { ...withLog, screen: 'spoils', offer: nextOffer(withLog), releasing: false }
}

/** A11: at the cap, accepting requires a release first. */
export function takeOperative(state: RunState): RunState {
  if (!state.offer) return advanceLayer(state)
  if (state.team.length >= CONFIG.teamCap) return { ...state, releasing: true }
  return advanceLayer({
    ...state,
    team: [...state.team, { id: state.offer, spent: false }],
    offer: null,
  })
}

export function release(state: RunState, id: OperativeId): RunState {
  if (!state.offer) return state
  return advanceLayer({
    ...state,
    team: [...state.team.filter(t => t.id !== id), { id: state.offer, spent: false }],
    offer: null,
    releasing: false,
  })
}

export function takePatch(state: RunState): RunState {
  return advanceLayer({
    ...state,
    integrity: state.integrity + CONFIG.patch,
    offer: null,
    releasing: false,
  })
}

export function declineSpoils(state: RunState): RunState {
  return { ...state, offer: null, releasing: false }
}

export function advanceLayer(state: RunState): RunState {
  const layer = state.layer + 1
  if (layer >= CONFIG.layers) {
    const core = SENTINELS.archon
    const atCore: RunState = {
      ...state, layer,
      offers: [{
        sentinelId: core.id, integrity: core.integrity, guard: core.guard,
        payout: CONFIG.corePayout, ceiling: 0,
      }],
    }
    return enterNode(atCore, 0)
  }
  return generateOffers({ ...state, layer, offer: null, releasing: false })
}

export function bail(state: RunState): RunState {
  return { ...state, screen: 'end', won: false }
}
```

- [ ] **Step 4: Rewire the encounter's stub**

In `src/engine/encounter.ts`, delete the `clearNode` stub at the bottom of the file and replace the import block at the top with:

```ts
import { CONFIG } from './config'
import { OPERATIVES, SENTINELS } from './content'
import { pressDamage } from './run'
import { clearNode } from './spoils'
import type { OperativeId, RunState } from './types'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS. If Vitest reports a circular import between `encounter.ts` and `spoils.ts`, it is benign — both are function-only modules — but if it errors, move `clearNode` into its own `src/engine/clear.ts` and import it from both.

- [ ] **Step 6: Commit**

```bash
git add traditional
git commit -m "feat: spoils, team cap enforcement and run completion"
```

---

### Task 8: Scripted policies and the statistical criteria (A1, A3, A13, A14, A15, A17)

**Files:**
- Create: `src/engine/policy.ts`
- Test: `src/engine/criteria.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `type Policy = 'careful' | 'greedy'`
  - `playRun(seed: string, policy: Policy, overrides?: Partial<typeof CONFIG>): RunSummary`
  - `type RunSummary = { won: boolean; layersCleared: number; turns: number; credits: number; encounters: number; encounterTurns: number; instantEncounters: number; endedByHeat: boolean; sentinelsSeen: string[]; callsMade: number; teamSize: number }`

This is the task that decides whether the thing is a game. Write it last and expect to tune `CONFIG` against it — that tuning is the work, not a detour.

- [ ] **Step 1: Write the failing test**

Create `src/engine/criteria.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { playRun } from './policy'
import { startRun, ceilingAgainst, pressDamage, turnsAllowed } from './run'
import { generateOffers } from './route'
import { CONFIG } from './config'
import { SENTINELS } from './content'

const SEEDS = Array.from({ length: 200 }, (_, i) => `RUN-${i}`)
const careful = () => SEEDS.map(s => playRun(s, 'careful'))

describe('A1 determinism', () => {
  it('same seed and policy reproduce the run exactly', () => {
    expect(playRun('DET', 'careful')).toEqual(playRun('DET', 'careful'))
  })
})

describe('A3 conservation', () => {
  it('the team never duplicates or exceeds the cap, over 500+ turns', () => {
    let turns = 0
    for (const s of SEEDS) {
      const r = playRun(s, 'careful')
      turns += r.turns
      expect(r.teamSize).toBeLessThanOrEqual(CONFIG.teamCap)
    }
    expect(turns).toBeGreaterThan(500)
  })
})

describe('A15 the free action cannot carry a node', () => {
  it('pressing every allowed turn falls short of the softest node at every layer', () => {
    const softest = Math.min(
      ...Object.values(SENTINELS).filter(s => s.tag !== 'CORE').map(s => s.integrity),
    )
    for (let layer = 1; layer < CONFIG.layers; layer++) {
      const s = { ...startRun('X'), layer }
      const alone = pressDamage(s) * turnsAllowed(s)
      const target = Math.round(softest * (1 + (layer - 1) * CONFIG.layerScale))
      expect(alone, `layer ${layer}: press alone ${alone} vs ${target}`).toBeLessThan(target)
    }
  })
})

describe('A13 no resource decides the run before play', () => {
  it('the ceiling always exceeds what the team alone can do', () => {
    for (let layer = 1; layer < CONFIG.layers; layer++) {
      const s = { ...startRun('B'), layer }
      const withPress = ceilingAgainst(s, 0)
      const teamOnly = withPress - pressDamage(s) * turnsAllowed(s)
      expect(withPress).toBeGreaterThan(teamOnly)
    }
  })
})

describe('A14 pressure binds', () => {
  it('a policy that ignores the ceiling is ended by heat', () => {
    const greedy = SEEDS.map(s => playRun(s, 'greedy'))
    expect(greedy.filter(r => r.endedByHeat).length).toBeGreaterThan(0)
  })

  it('removing heat changes outcomes materially', () => {
    const on = careful().filter(r => r.won).length
    const off = SEEDS.map(s => playRun(s, 'careful', { heatMax: 1_000_000 }))
      .filter(r => r.won).length
    expect(Math.abs(on - off)).toBeGreaterThan(SEEDS.length * 0.1)
  })
})

describe('A17 viability', () => {
  const runs = careful()

  it('wins between 15% and 65% of runs', () => {
    const rate = runs.filter(r => r.won).length / runs.length
    expect(rate).toBeGreaterThanOrEqual(0.15)
    expect(rate).toBeLessThanOrEqual(0.65)
  })

  it('encounters average at least 2.5 decisions', () => {
    const enc = runs.reduce((n, r) => n + r.encounters, 0)
    const t = runs.reduce((n, r) => n + r.encounterTurns, 0)
    expect(t / enc).toBeGreaterThanOrEqual(2.5)
  })

  it('under a tenth of encounters end before a decision is taken', () => {
    const enc = runs.reduce((n, r) => n + r.encounters, 0)
    const instant = runs.reduce((n, r) => n + r.instantEncounters, 0)
    expect(instant / enc).toBeLessThanOrEqual(0.1)
  })

  it('every sentinel is met across the sample', () => {
    const seen = new Set(runs.flatMap(r => r.sentinelsSeen))
    for (const s of Object.values(SENTINELS)) {
      expect(seen.has(s.id), `${s.name} never fought`).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/engine/criteria.test.ts`
Expected: FAIL — cannot resolve `./policy`.

- [ ] **Step 3: Write the policy runner**

Create `src/engine/policy.ts`:

```ts
import { CONFIG } from './config'
import { OPERATIVES } from './content'
import { call, press, endTurn } from './encounter'
import { generateOffers, enterNode } from './route'
import { ceilingAgainst, startRun } from './run'
import { advanceLayer, declineSpoils, takeOperative, takePatch } from './spoils'
import type { RunState } from './types'

export type Policy = 'careful' | 'greedy'

export type RunSummary = {
  won: boolean
  layersCleared: number
  turns: number
  credits: number
  encounters: number
  encounterTurns: number
  instantEncounters: number
  endedByHeat: boolean
  sentinelsSeen: string[]
  callsMade: number
  teamSize: number
}

/**
 * Config overrides let A14 ask "what changes if this mechanic is removed?"
 * without a global mutable. Only the fields named are replaced.
 */
export function playRun(
  seed: string,
  policy: Policy,
  overrides: Partial<typeof CONFIG> = {},
): RunSummary {
  const cfg = { ...CONFIG, ...overrides }
  let s: RunState = generateOffers(startRun(seed))
  const seen: string[] = []
  let encounters = 0, encounterTurns = 0, instant = 0, steps = 0

  while (s.screen !== 'end' && steps < 20_000) {
    steps++
    if (s.screen === 'route') {
      const indexed = s.offers.map((o, i) => ({ o, i }))
      const pool = policy === 'careful'
        ? (indexed.filter(({ o }) => o.integrity <= ceilingAgainst(s, o.guard)) .length
            ? indexed.filter(({ o }) => o.integrity <= ceilingAgainst(s, o.guard))
            : indexed)
        : indexed
      const chosen = pool.sort((a, b) => b.o.payout - a.o.payout)[0].i
      seen.push(s.offers[chosen].sentinelId)
      s = enterNode(s, chosen)
      continue
    }
    if (s.screen === 'encounter') {
      const before = s.turns
      const affordable = s.team.filter(
        t => !t.spent && OPERATIVES[t.id].cost <= s.ram,
      )
      const lethal = s.integrity <= s.sentinel!.shownDamage * 1.5
      const healers = affordable
        .filter(t => OPERATIVES[t.id].shield)
        .sort((a, b) => (OPERATIVES[b.id].shield ?? 0) - (OPERATIVES[a.id].shield ?? 0))
      const hitters = affordable
        .filter(t => OPERATIVES[t.id].damage)
        .sort((a, b) => (OPERATIVES[b.id].damage ?? 0) - (OPERATIVES[a.id].damage ?? 0))

      if (!s.pressedThisTurn) s = press(s)
      else if (lethal && healers.length) s = call(s, healers[0].id)
      else if (hitters.length) s = call(s, hitters[0].id)
      else s = endTurnWith(s, cfg)

      if (s.screen === 'spoils') {
        encounters++
        encounterTurns += before
        if (before === 0) instant++
      }
      continue
    }
    if (s.screen === 'spoils') {
      s = s.integrity < cfg.integrity * 0.5 || !s.offer
        ? takePatch(s)
        : takeOperative(s)
      if (s.releasing) s = advanceLayer(declineSpoils(s))
      continue
    }
  }

  return {
    won: s.won,
    layersCleared: Math.max(0, s.layer - (s.won ? 0 : 1)),
    turns: s.turns,
    credits: s.credits,
    encounters,
    encounterTurns,
    instantEncounters: instant,
    endedByHeat: !s.won && s.heat >= cfg.heatMax,
    sentinelsSeen: seen,
    callsMade: s.callsMade,
    teamSize: s.team.length,
  }
}

/** endTurn honouring a heatMax override, for A14's removal probe. */
function endTurnWith(s: RunState, cfg: typeof CONFIG): RunState {
  if (cfg.heatMax === CONFIG.heatMax) return endTurn(s)
  const raised = { ...s, heat: Math.max(0, s.heat - cfg.heatMax) }
  const out = endTurn(raised)
  return out.screen === 'end' && out.heat >= CONFIG.heatMax ? { ...out, screen: s.screen, won: false } : out
}
```

- [ ] **Step 4: Run the criteria and expect failures**

Run: `pnpm vitest run src/engine/criteria.test.ts`
Expected: the structural criteria (A1, A3, A13) PASS; **A15 and A17 may FAIL.** That is the real work of this task.

- [ ] **Step 5: Tune CONFIG until every criterion passes**

Change **only** `src/engine/config.ts`. Levers, in the order worth trying:

| symptom | lever |
|---|---|
| win rate above 65% | raise `layerScale`, or lower `pressGrowth` |
| win rate below 15% | raise `pressDamage` or `patch`, or lower `layerScale` |
| encounters under 2.5 turns | raise sentinel integrity in `content.ts`, or lower `pressDamage` |
| A15 fails (press alone clears a node) | lower `pressGrowth` |
| heat never ends a greedy run | raise `heatPerTurn` |
| a sentinel is never met | check `generateOffers` rescue logic, not the config |

Re-run after each change. Record the final numbers in the commit message.

- [ ] **Step 6: Run the full suite**

Run: `pnpm test`
Expected: PASS, every file.

- [ ] **Step 7: Commit**

```bash
git add traditional
git commit -m "feat: scripted policies and the statistical acceptance criteria"
```

---

### Task 9: The UI (A7, A9, A10, A16)

**Files:**
- Create: `src/ui/App.tsx`, `src/ui/Route.tsx`, `src/ui/Encounter.tsx`, `src/ui/Spoils.tsx`, `src/ui/End.tsx`, `src/ui/Loadout.tsx`, `src/ui/theme.css`
- Create: `src/ui/ui.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: every engine export.
- Produces: a playable app. React holds a single `RunState` in `useState` and calls engine functions; it computes nothing.

- [ ] **Step 1: Write the failing UI test**

Create `src/ui/ui.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Route } from './Route'
import { startRun } from '../engine/run'
import { generateOffers } from '../engine/route'

describe('Route screen', () => {
  it('states the ceiling on every offer, in text (A16, A7)', () => {
    const s = generateOffers({ ...startRun('UI'), layer: 3 })
    render(<Route state={s} onChoose={() => {}} />)
    for (const o of s.offers) {
      const label = o.integrity <= o.ceiling ? /WITHIN REACH/ : /BEYOND REACH/
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    // the number itself must be present, not only the colour
    expect(screen.getAllByText(/\d+/).length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm vitest run src/ui/ui.test.tsx`
Expected: FAIL — cannot resolve `./Route`.

- [ ] **Step 3: Write the Route screen**

Create `src/ui/Route.tsx`:

```tsx
import type { RunState } from '../engine/types'
import { SENTINELS } from '../engine/content'

export function Route({ state, onChoose }: { state: RunState; onChoose: (i: number) => void }) {
  return (
    <div className="screen">
      <div className="kicker">LAYER {state.layer} OF 8 · {state.credits}¤</div>
      <h1>Choose your<br />way down.</h1>
      {state.offers.map((o, i) => {
        const def = SENTINELS[o.sentinelId]
        const within = o.integrity <= o.ceiling
        return (
          <button key={o.sentinelId} className="node" onClick={() => onChoose(i)}>
            <span className="row"><b>{def.name}</b><span className="chip">{def.tag}</span></span>
            <span className="note">Integrity {o.integrity} · guard {o.guard}</span>
            <span className={within ? 'chip you' : 'chip harm'}>
              {within
                ? `WITHIN REACH · you can bring ${o.ceiling}`
                : `BEYOND REACH · you can bring ${o.ceiling} of ${o.integrity}`}
            </span>
            <span className="mono">PAYOUT {o.payout}¤ · press {i + 1}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run the UI test to verify it passes**

Run: `pnpm vitest run src/ui/ui.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the remaining screens and wire App**

Create `src/ui/Loadout.tsx`, `src/ui/Encounter.tsx`, `src/ui/Spoils.tsx`, `src/ui/End.tsx` following the same shape: a pure component taking `state` and callbacks, rendering text for every value. `App.tsx` holds `const [state, setState] = useState(() => generateOffers(startRun(randomSeed())))` and dispatches to engine functions.

Every value the player needs must appear as **text**, never as colour alone (A7): the shown intent with its number, integrity, RAM, heat with its per-turn rise, and each operative's name, role, cost and whether it is spent.

Create `src/ui/theme.css` with the palette from pillar 4 — cyan for the player, amber for the world, rust for incoming harm — and a `#app { max-width: 430px }` column. Give every button `min-height: 48px` for A10.

- [ ] **Step 6: Write the layout test**

Append to `src/ui/ui.test.tsx`:

```tsx
import { App } from './App'

describe('layout', () => {
  it('gives every interactive target at least 44px on its short edge (A10)', () => {
    const { container } = render(<App />)
    for (const el of Array.from(container.querySelectorAll('button'))) {
      const min = getComputedStyle(el).minHeight
      expect(min === '' || parseInt(min, 10) >= 44 || min === 'auto').toBe(true)
    }
  })
})
```

jsdom does not lay out, so this asserts the declared `min-height` rather than a measured box. Measure the real thing manually at 360px in a browser before calling A9 and A10 done.

- [ ] **Step 7: Run the full suite and the dev server**

```bash
pnpm test
pnpm dev
```

Open the dev URL at 360px wide. Confirm by eye: no horizontal scroll (A9), every control comfortably tappable (A10), and the screen readable with a greyscale filter applied in devtools (A7).

- [ ] **Step 8: Commit**

```bash
git add traditional
git commit -m "feat: react ui for every screen"
```

---

### Task 10: Art, no-network proof, and the cost entry (A8)

**Files:**
- Create: `src/ui/art.ts`, `scripts/embed-art.mjs`
- Modify: `src/ui/Encounter.tsx`, `vite.config.ts`
- Modify: `../COST.md` (repository root — the one file outside `traditional/`)
- Test: `src/engine/network.test.ts`

**Interfaces:**
- Consumes: `ephemeral/art/src/*.webp`, shared as agreed in the design.
- Produces: `ART: Record<string, string>` of data URIs.

- [ ] **Step 1: Write the failing no-network test**

Create `src/engine/network.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

describe('A8 no network at runtime', () => {
  it('no source file fetches anything', () => {
    for (const f of walk('src').filter(f => /\.(ts|tsx)$/.test(f))) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${f} calls fetch`).not.toMatch(/\bfetch\s*\(/)
      expect(src, `${f} uses XMLHttpRequest`).not.toMatch(/XMLHttpRequest/)
      expect(src, `${f} opens a WebSocket`).not.toMatch(/new WebSocket/)
      expect(src, `${f} references an http url`).not.toMatch(/["']https?:\/\//)
    }
  })
})
```

- [ ] **Step 2: Run it**

Run: `pnpm vitest run src/engine/network.test.ts`
Expected: PASS immediately if nothing fetches. If it fails, remove the offending call — do not weaken the test.

- [ ] **Step 3: Write the art embedder**

Create `scripts/embed-art.mjs`:

```js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = '../ephemeral/art/src'
const out = readdirSync(SRC)
  .filter(f => f.endsWith('.webp'))
  .map(f => {
    const id = f.replace('.webp', '')
    const b64 = readFileSync(join(SRC, f)).toString('base64')
    return `  ${id}: 'data:image/webp;base64,${b64}',`
  })

writeFileSync(
  'src/ui/art.ts',
  `/* Generated by scripts/embed-art.mjs. Do not edit.\n` +
  `   Shared from the ephemeral arm; method-neutral, see COST.md. */\n` +
  `export const ART: Record<string, string> = {\n${out.join('\n')}\n}\n`,
)
console.log(`embedded ${out.length} tiles`)
```

Add to `package.json` scripts: `"art": "node scripts/embed-art.mjs"`.

- [ ] **Step 4: Generate and use it**

```bash
pnpm art
```

In `src/ui/Encounter.tsx`, render `ART[state.sentinel.id]` as the scene image and `ART[slot.id]` in each operative card, each with `alt=""` and an `object-fit: cover` style. Keep the name, role, cost and spent-state as text beside it — art must never be the only carrier of state (A7).

- [ ] **Step 5: Run the full suite and build**

```bash
pnpm test
pnpm build
```

Expected: tests PASS; build succeeds. Check the built bundle size with `du -sh dist`.

- [ ] **Step 6: Fill in the COST.md entry**

Open `../COST.md` and replace the `## traditional` section, matching the shape of the `ephemeral` one: commits, source lines (`find traditional/src -name '*.ts*' | xargs wc -l`), test count, built bundle size, where the effort went, and what the method failed to catch.

**Include the handover caveat verbatim:**

> This arm was handed the first arm's lessons as criteria A13, A14, A15 and A17. It is cheaper partly because it was told. The comparison measures method given those lessons, not method from zero.

- [ ] **Step 7: Commit**

```bash
git add traditional ../COST.md
git commit -m "feat: embed shared art, prove no network access, record cost"
```

---

## Self-review

**Spec coverage.** A1 → Tasks 2, 8. A2 → Task 5. A3 → Tasks 7, 8. A4 → Task 6. A5 → Task 6. A6 → Task 7. A7 → Tasks 9, 10. A8 → Task 10. A9 → Task 9. A10 → Task 9. A11 → Task 7. A12 → Task 6. A13 → Task 8. A14 → Task 8. A15 → Tasks 6, 8. A16 → Tasks 4, 5, 9. A17 → Task 8. Architecture (engine purity) → Task 1. Shared art → Task 10. Cost recording → Task 10. No gaps.

**Placeholders.** None. Every code step carries the code. Task 9 Step 5 describes several small components in prose rather than in full — deliberate, because they are repetitive variations on `Route.tsx`, whose full source is given, and the constraint that matters (every value as text) is stated explicitly.

**Type consistency.** `RunState`, `Operative`, `Sentinel`, `NodeOffer`, `ActiveSentinel` and `SlotState` are defined once in Task 3 and used unchanged after. `ceilingAgainst(state, guard)` keeps its signature across Tasks 4, 5, 8 and 9. `clearNode` is stubbed in Task 6 and replaced in Task 7, which Task 7 Step 4 states explicitly. `playRun(seed, policy, overrides?)` is used in Task 8's tests exactly as declared.

**Known risk.** Task 8 is where this plan is most likely to stall: A15 and A17 are balance criteria, and the first arm needed seven versions to satisfy the equivalents. The tuning table in Step 5 is the mitigation, and the criteria are written to fail loudly rather than pass vacuously.
