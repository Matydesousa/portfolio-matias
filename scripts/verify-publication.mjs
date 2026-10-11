import { build } from 'astro';
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

// Reserved test domain and isolated output; do not configure or publish this URL.
const site = 'https://portfolio.example.test';
const output = await fs.mkdtemp(
  path.join(os.tmpdir(), 'portfolio-publication-'),
);
const previousSite = process.env.PUBLIC_SITE_URL;
let browser;
try {
  process.env.PUBLIC_SITE_URL = site;
  await build({ outDir: output });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || undefined,
    headless: true,
  });
  const page = await browser.newPage();
  const parse = (text, kind) =>
    page.evaluate(
      ({ text, kind }) => {
        const doc = new DOMParser().parseFromString(text, kind);
        return {
          invalid: doc.querySelector('parsererror')?.textContent,
          entries: [...doc.getElementsByTagName('url')].map((url) => ({
            loc: url.getElementsByTagName('loc')[0]?.textContent,
            alternates: [
              ...url.getElementsByTagNameNS(
                'http://www.w3.org/1999/xhtml',
                'link',
              ),
            ].map((link) => ({
              lang: link.getAttribute('hreflang'),
              href: link.getAttribute('href'),
            })),
          })),
          canonical: doc
            .querySelector('link[rel="canonical"]')
            ?.getAttribute('href'),
          image: doc
            .querySelector('meta[property="og:image"]')
            ?.getAttribute('content'),
          card: doc
            .querySelector('meta[name="twitter:card"]')
            ?.getAttribute('content'),
          robots: doc
            .querySelector('meta[name="robots"]')
            ?.getAttribute('content'),
          alternates: [...doc.querySelectorAll('link[rel="alternate"]')].map(
            (link) => ({
              lang: link.getAttribute('hreflang'),
              href: link.getAttribute('href'),
            }),
          ),
        };
      },
      { text, kind },
    );
  const sitemap = await parse(
    await fs.readFile(path.join(output, 'sitemap.xml'), 'utf8'),
    'application/xml',
  );
  assert(!sitemap.invalid);
  assert.equal(sitemap.entries.length, 12);
  assert.equal(new Set(sitemap.entries.map((entry) => entry.loc)).size, 12);
  for (const { loc, alternates } of sitemap.entries) {
    assert(!loc.includes('404'));
    const pathname = new URL(loc).pathname;
    const meta = await parse(
      await fs.readFile(path.join(output, pathname, 'index.html'), 'utf8'),
      'text/html',
    );
    assert.equal(meta.canonical, loc);
    assert.equal(
      meta.image,
      `${site}/images/social-preview-${pathname.startsWith('/en/') ? 'en' : 'es'}.png`,
    );
    assert.equal(meta.card, 'summary_large_image');
    assert.equal(alternates.length, 3);
    assert.deepEqual(meta.alternates, alternates);
    for (const alternate of alternates)
      assert(sitemap.entries.some((entry) => entry.loc === alternate.href));
    assert(
      (await fs.stat(path.join(output, new URL(meta.image).pathname))).size > 0,
    );
  }
  for (const file of ['404.html', 'en/404/index.html']) {
    const meta = await parse(
      await fs.readFile(path.join(output, file), 'utf8'),
      'text/html',
    );
    assert.equal(meta.robots, 'noindex, follow');
    assert.equal(meta.canonical, undefined);
    assert.equal(meta.alternates.length, 0);
  }
  assert.equal(
    await fs.readFile(path.join(output, 'robots.txt'), 'utf8'),
    `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`,
  );
  for (const locale of ['es', 'en']) {
    const png = await fs.readFile(
      path.join(output, `images/social-preview-${locale}.png`),
    );
    assert.equal(png.readUInt32BE(16), 1200);
    assert.equal(png.readUInt32BE(20), 630);
  }
  console.log(
    'Publication verified: 12 canonical pages, localized social images, reciprocal language alternates, sitemap, robots and noindex error pages.',
  );
} finally {
  await browser?.close();
  if (previousSite === undefined) delete process.env.PUBLIC_SITE_URL;
  else process.env.PUBLIC_SITE_URL = previousSite;
  // Only remove the uniquely owned directory directly under the system temp root.
  if (
    path.dirname(path.resolve(output)) === path.resolve(os.tmpdir()) &&
    path.basename(output).startsWith('portfolio-publication-')
  )
    await fs.rm(output, { recursive: true, force: true });
}
