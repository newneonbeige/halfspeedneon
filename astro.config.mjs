import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './site.config.mjs';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !/\/(impressum|datenschutz)\/$/.test(page),
    }),
  ],
});
