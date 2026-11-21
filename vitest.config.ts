import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@world': path.resolve(__dirname, './src/world'),
      '@rp': path.resolve(__dirname, './src/rp'),
      '@game': path.resolve(__dirname, './src/game'),
      '@server': path.resolve(__dirname, './src/server'),
    },
  },
})
