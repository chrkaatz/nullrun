/** Every balance number lives here. Nothing else may hold a magic number. */
export const CONFIG = {
  layers: 8,
  offersPerLayer: 3,
  /** Starting integrity, not a cap: patches and shields are deliberately unbounded. */
  integrity: 60,
  ram: 3,
  teamCap: 8,
  heatMax: 100,
  heatPerTurn: 15,
  pressDamage: 3,
  pressGrowth: 1.7,
  minHit: 1,
  patch: 48,
  logLines: 4,
  payoutFlat: 60,
  payoutPerIntegrity: 1.2,
  corePayout: 600,
  layerScale: 0.10,
} as const

export type Config = typeof CONFIG
