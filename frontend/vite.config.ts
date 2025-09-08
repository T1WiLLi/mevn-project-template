import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5173,
    },
    proxy: {
      '/api': 'https://backend:5000',
    },
  },
});
