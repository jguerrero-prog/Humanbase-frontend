import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { apiProxy } from '../../dev-proxy.ts';

export default defineConfig({
  base: process.env.WEB_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy: apiProxy() },
  preview: { port: 4173, strictPort: true, proxy: apiProxy() },
});
