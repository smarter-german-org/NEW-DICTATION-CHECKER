import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/NEW-DICTATION-CHECKER/', // Base path for GitHub Pages
  server: {
    host: '0.0.0.0', // Listen on all local IPs to allow access from within the network
    port: 5173,      // Default port
    strictPort: true,
    open: true,      // Automatically open in browser
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate source maps for easier debugging
    sourcemap: true,
    // Optimize build size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs
      },
    },
    // Optimize chunks for embedding
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['./src/utils/textUtils.js', './src/utils/debug.js']
        }
      }
    }
  }
}) 