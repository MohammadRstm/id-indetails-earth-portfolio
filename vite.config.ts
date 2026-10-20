import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development the API runs on https://localhost:7187 (its "https" launch profile). Proxying only the public
// website API keeps the browser on one origin, as nginx does in production.
const api = process.env.HOURLINE_API ?? 'https://localhost:7187'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/public/website': { target: api, changeOrigin: true, secure: false },
    },
  },
})
