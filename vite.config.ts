import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
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
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4000', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:4000', ws: true },
    },
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
})
