import { defineConfig } from 'astro/config';

// Set PUBLIC_SITE_URL only after choosing the real production domain.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || undefined,
  output: 'static',
  devToolbar: { enabled: false },
});
