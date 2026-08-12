import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        captura: resolve(import.meta.dirname, 'index.html'),
        obrigado: resolve(import.meta.dirname, 'ob/index.html'),
        privacidade: resolve(import.meta.dirname, 'privacidade/index.html'),
        termos: resolve(import.meta.dirname, 'termos/index.html'),
      },
    },
  },
});
