/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5500,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries from page chunks to improve caching.
        // Each page is already a separate chunk via React.lazy — this just
        // isolates the large stable dependencies from the frequently-changing page code.
        manualChunks(id) {
          // React runtime + DOM
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // TanStack (Query + Virtual)
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-tanstack';
          }
          // Zustand
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }
          // Lucide icons (large icon library)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Other node_modules go into a shared vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
