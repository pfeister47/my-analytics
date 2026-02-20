import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['googleapis', 'google-auth-library', 'node-fetch', 'gcp-metadata', 'gtoken'],
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Don't bundle anything from the api folder or server-side packages
        if (id.includes('/api/')) return true;
        const serverPackages = ['googleapis', 'google-auth-library', 'node-fetch', 
          'gcp-metadata', 'gtoken', 'node:stream', 'node:util', 'node:buffer',
          'node:http', 'node:https', 'node:url', 'node:path', 'node:fs', 'node:os',
          'node:crypto', 'node:events', 'node:net', 'node:tls', 'node:zlib'];
        return serverPackages.some(pkg => id === pkg || id.startsWith(pkg + '/'));
      },
    },
  },
})
