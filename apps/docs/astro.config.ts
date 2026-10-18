import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { apiProxy } from '../../dev-proxy.ts';

export default defineConfig({
  integrations: [react(), mdx()],
  server: { port: 4321 },
  markdown: { shikiConfig: { theme: 'css-variables' } },
  vite: { server: { proxy: apiProxy() }, preview: { proxy: apiProxy() } },
});
