import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()],
  
   resolve: {
    alias: {
      stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
      buffer: path.resolve(__dirname, 'node_modules/buffer'),
      process: path.resolve(__dirname, 'node_modules/process/browser.js'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer', 'process', 'stream-browserify'],
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
})
