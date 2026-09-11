import type { Operative, OperativeId, Sentinel } from './types'

export const OPERATIVES: Record<OperativeId, Operative> = {
  velvet:   { id: 'velvet',   name: 'VELVET',      role: 'FACE',        cost: 0, tier: 0, text: 'Talks you an opening. +7 integrity.', shield: 7 },
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
  hunter: { id: 'hunter', name: 'HUNTER',        tag: 'HARD',   integrity: 75,  guard: 2, intents: [{ label: 'HUNT', damage: 8 }] },
  sweep:  { id: 'sweep',  name: 'CORPSEC SWEEP', tag: 'HARD',   integrity: 80,  guard: 1, intents: [{ label: 'BURST', damage: 5 }, { label: 'SUPPRESS', damage: 9 }] },
  archon: { id: 'archon', name: 'ARCHON',        tag: 'CORE',   integrity: 144, guard: 3, intents: [{ label: 'SHOCKWAVE', damage: 10 }, { label: 'RESTORE', damage: 0, restore: 2 }, { label: 'SHOCKWAVE', damage: 12 }] },
}
