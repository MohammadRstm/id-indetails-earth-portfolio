import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // In development (and `vite preview`) the site reads the public website API through this proxy, so the
  // browser stays on one origin as in production. By default it reads the live site's API; DEV_API_TARGET
  // in .env points it elsewhere, such as a local API (http://localhost:5164).
  const target = loadEnv(mode, process.cwd(), '').DEV_API_TARGET || 'https://id-indetails.com'
  const proxy = { '/api/public/website': { target, changeOrigin: true } }
  return {
    plugins: [react()],
    server: { proxy },
    preview: { proxy },
  }
})
