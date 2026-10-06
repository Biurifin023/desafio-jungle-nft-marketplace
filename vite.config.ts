import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    svgr({ svgrOptions: { dimensions: false } }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(import.meta.dirname, 'src') },
      // O cookie store do MSW não é usado (auth por Bearer); ver src/mocks/vendor/tough-cookie.ts.
      { find: /^tough-cookie$/, replacement: path.resolve(import.meta.dirname, 'src/mocks/vendor/tough-cookie.ts') },
    ],
  },
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    target: 'es2022',
  },
})
