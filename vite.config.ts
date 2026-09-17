import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // The app runs Vite in middleware mode behind the custom Express server.
      // Disable Vite's browser HMR socket because preview restarts can leave the
      // old socket alive and make @vite/client report "WebSocket closed without opened".
      hmr: false,
      // File watching remains configurable for local development.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
