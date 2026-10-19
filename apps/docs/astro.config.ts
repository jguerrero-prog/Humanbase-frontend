import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';
import { apiProxy } from '../../dev-proxy.ts';

export default defineConfig({
  base: process.env.DOCS_BASE ?? '/',
  integrations: [react(), mdx()],
  server: { port: 4321 },
  markdown: { shikiConfig: { theme: 'css-variables' } },
  // Inlined scripts keep Vite's __VITE_PRELOAD__ placeholder, which breaks the search's dynamic import.
  vite: { build: { assetsInlineLimit: 0 }, server: { proxy: apiProxy() }, preview: { proxy: apiProxy() } },
});
