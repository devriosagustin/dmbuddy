import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base para publicar bajo https://devriosagustin.github.io/dmbuddy/
  base: '/dmbuddy/',
})