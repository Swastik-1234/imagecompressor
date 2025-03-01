import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  preview: {
    port: import.meta.env.PORT || 3000,
    host: '0.0.0.0'
  }
})