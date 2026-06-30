import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor: charts (Recharts is ~400KB unminified)
          'vendor-charts': ['recharts'],
          // Vendor: graph visualization
          'vendor-flow': ['@xyflow/react'],
          // Vendor: icons + misc
          'vendor-icons': ['lucide-react'],
          // Vendor: HTTP client
          'vendor-axios': ['axios'],
        },
      },
    },
  },
})
