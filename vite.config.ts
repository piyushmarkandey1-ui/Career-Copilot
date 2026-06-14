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
        // Proxy /api/* → Express server in development so there are no CORS issues
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // ── Build ────────────────────────────────────────────────────────────────
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Split vendor chunks for better long-term caching
          manualChunks: {
            react:  ['react', 'react-dom'],
            router: ['react-router-dom'],
          },
        },
      },
    },
  }
})
