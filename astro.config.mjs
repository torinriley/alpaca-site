import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://torinriley.github.io',
  base: '/alpaca-site',
  integrations: [svelte()],
  markdown: { shikiConfig: { theme: 'vitesse-light' } },
});
