import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 5173 falls inside a Windows/Hyper-V reserved port range (5131–5230),
    // which causes EACCES on bind. 3000 is outside all reserved ranges and is
    // already in the backend CORS allowlist.
    port: 3000,
    proxy: {
      // Proxy API + uploads + websockets to the backend during development.
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
