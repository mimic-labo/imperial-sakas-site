// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://imperial.sakas.work',
  output: 'static',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [sitemap(), mdx()],
  build: { format: 'directory' },
});
