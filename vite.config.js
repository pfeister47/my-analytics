import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['googleapis', 'google-auth-library', 'node-fetch', 'stream', 'util', 'buffer'],
    },
  },
  optimizeDeps: {
    exclude: ['googleapis', 'google-auth-library'],
  },
})
