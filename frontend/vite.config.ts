import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },
    hmr: {
    }
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
}) 