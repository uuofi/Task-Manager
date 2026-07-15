import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Where the dev server forwards /api, /uploads and /socket.io. Defaults to the
// backend on the host; docker-compose.dev.yml overrides it with the compose
// service name, since inside a container `localhost` is the client itself.
const devProxyTarget = process.env.DEV_PROXY_TARGET || 'http://localhost:5050';

const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true';

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
    // Bind-mounted sources (docker-compose.dev.yml) do not deliver filesystem
    // events into the container, so the watcher must poll or edits go unnoticed.
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
    proxy: {
      // Proxy API + uploads + websockets to the backend during development.
      '/api': {
        target: devProxyTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: devProxyTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: devProxyTarget,
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
