import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      googleapis: resolve(__dirname, 'src-stub-server.js'),
      'google-auth-library': resolve(__dirname, 'src-stub-server.js'),
      'node-fetch': resolve(__dirname, 'src-stub-server.js'),
    },
  },
})
