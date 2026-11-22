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
    // Phase 1.5 (F8): the single 1.07 MB chunk delayed first paint because the
    // title art waited behind three.js. Three vendors are split so the HUD shell
    // paints while the 3D bundle streams in.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber'],
          react: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
})
