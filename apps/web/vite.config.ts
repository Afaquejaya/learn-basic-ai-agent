import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // never expose the dev server to the LAN
    port: 5173,
    strictPort: true,
    proxy: {
      // The API server (Phase 2+) listens on 127.0.0.1:8787.
      '/api': 'http://127.0.0.1:8787',
    },
  },
});
