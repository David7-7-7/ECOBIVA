import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Todo lo que empiece por /api se redirige al backend Express
      // (ajusta el puerto si tu .env usa otro distinto de 3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
