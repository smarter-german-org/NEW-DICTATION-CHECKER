import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all local IPs to allow access from within the network
    port: 5173,      // Default port
    strictPort: true,
    open: true,      // Automatically open in browser
  }
}) 