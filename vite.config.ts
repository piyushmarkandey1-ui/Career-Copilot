import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],

    // ── Dev server ──────────────────────────────────────────────────────────
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          proxyTimeout: 60000,
          timeout: 60000,
        },
      },
    },

    // ── Build ────────────────────────────────────────────────────────────────
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('react-router-dom')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          },
        },
      },
    },
  }
})
