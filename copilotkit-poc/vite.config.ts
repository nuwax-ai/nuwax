import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api/copilotkit': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
    },
  },
});
