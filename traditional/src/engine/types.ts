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
  guard: number
  intentIndex: number
  /** frozen the moment it is shown — A4 */
  shownIntent: Intent
  shownDamage: number
}

export type RunState = {
  seed: string
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
