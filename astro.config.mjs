// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export const SITE = 'https://seeing-maintaining-learning.github.io';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  integrations: [
    svelte(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      lastmod: new Date(),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (path === '/') item.priority = 1.0;
        else if (path.split('/').filter(Boolean).length === 1) item.priority = 0.9;
        return item;
      },
    }),
  ],
  build: { format: 'directory' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
