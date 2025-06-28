import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
    },
    hmr: {
      overlay: false,
    },
    watch: {
      usePolling: true
    }
  },
});