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
  minHit: 1,
  patch: 24,
  logLines: 4,
  payoutFlat: 60,
  payoutPerIntegrity: 1.2,
  corePayout: 600,
  layerScale: 0.14,
  unlock: { 1: 400, 2: 1200, 3: 2400 } as Record<number, number>,
} as const

export type Config = typeof CONFIG
