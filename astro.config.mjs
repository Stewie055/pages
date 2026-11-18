import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import legacyHeadings from './scripts/legacy-headings.mjs';

export default defineConfig({
  site: 'https://blog.erossr.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { processor: unified({ remarkPlugins: [legacyHeadings] }), shikiConfig: { theme: 'github-dark', wrap: true } },
});
