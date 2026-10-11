import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { publicSite, searchDiscovery } from './config/publication.mjs';

// Accept the real hosting URL as well as a custom domain; never invent a fallback.
const environment = loadEnv(
  process.env.NODE_ENV || 'production',
  process.cwd(),
  'PUBLIC_SITE_URL',
);
const site = publicSite(
  process.env.PUBLIC_SITE_URL ?? environment.PUBLIC_SITE_URL,
);
export default defineConfig({
  site,
  output: 'static',
  integrations: [searchDiscovery(site)],
  devToolbar: { enabled: false },
});
