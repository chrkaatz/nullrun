/** Every balance number lives here. Nothing else may hold a magic number. */
export const CONFIG = {
  layers: 8,
} as const

export type Config = typeof CONFIG
