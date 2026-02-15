import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    // ⚠️  IMPORTANT: This frontend (port 3003) proxies API requests to the backend
    // ⚠️  The backend MUST be running on port 50004 before starting the frontend
    // Backend is configured in: backend/.env (PORT=50004)
    // If you change the backend port, update the 'target' values below accordingly
    proxy: {
      '/api': {
        target: 'http://localhost:50004', // Backend API server port - MUST MATCH backend PORT in .env
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/uploads': {
        target: 'http://localhost:50004', // Backend API server port - MUST MATCH backend PORT in .env
        changeOrigin: true,
        secure: false
      }
    }
  }
})
