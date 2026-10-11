import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'mobile-effects.spec.ts',
  workers: 1,
  timeout: 120_000,
  use: { baseURL: 'http://127.0.0.1:4399', reducedMotion: 'no-preference' },
  projects: [
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 12 Pro Max'], browserName: 'webkit' },
    },
    {
      name: 'iphone-edge',
      use: {
        ...devices['iPhone 12 Pro Max'],
        browserName: 'chromium',
        channel: 'msedge',
      },
    },
    {
      name: 'small-webkit',
      use: {
        ...devices['iPhone 12 Pro Max'],
        browserName: 'webkit',
        viewport: { width: 320, height: 740 },
      },
    },
    {
      name: 'landscape-webkit',
      use: { ...devices['iPhone 12 Pro Max landscape'], browserName: 'webkit' },
    },
  ],
  webServer: {
    command: 'npx astro preview --host 127.0.0.1 --port 4399',
    url: 'http://127.0.0.1:4399',
    reuseExistingServer: !process.env.CI,
  },
});
