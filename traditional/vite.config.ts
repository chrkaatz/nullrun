import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    // environmentMatchGlobs is deprecated in Vitest 3 and removed in 4; its
    // replacement is projects. The engine suite is DOM-agnostic, so it runs
    // under either environment -- only the UI suite actually needs jsdom.
    projects: [
      {
        extends: true,
        test: { name: 'engine', environment: 'node', include: ['src/engine/**/*.test.ts'] },
      },
      {
        extends: true,
        test: { name: 'ui', environment: 'jsdom', include: ['src/ui/**/*.test.{ts,tsx}'] },
      },
    ],
  },
})
