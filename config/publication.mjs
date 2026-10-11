import { writeFile } from 'node:fs/promises';

/** @param {string | undefined} value */
export function publicSite(value) {
  if (!value?.trim()) return undefined;
  const message =
    'PUBLIC_SITE_URL must be an HTTPS root URL without credentials, path, query or fragment.';
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(message);
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(message);
  return url.href;
}

/** @param {string} value */
function xml(value) {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char],
  );
}

/** Build from actual static pages, without adding a runtime or dependency.
 * @param {string | undefined} site
 * @returns {import('astro').AstroIntegration}
 */
export function searchDiscovery(site) {
  return {
    name: 'portfolio-search-discovery',
    hooks: {
      'astro:build:done': async ({ pages, dir, logger }) => {
        if (!site) {
          logger.info(
            'PUBLIC_SITE_URL is empty: sitemap and robots.txt will be generated when the hosting URL is configured.',
          );
          return;
        }
        const paths = [
          ...new Set(
            pages.map(({ pathname }) => {
              const path = pathname.replace(/^\/+|\/+$/g, '');
              return path ? `/${path}/` : '/';
            }),
          ),
        ].filter((path) =>
          /^\/(?:en\/)?$|^\/proyectos\/[^/]+\/$|^\/en\/projects\/[^/]+\/$/.test(
            path,
          ),
        );
        const entries = paths.map((path) => {
          const english = path.startsWith('/en/');
          const es = english
            ? path
                .replace(/^\/en\/projects\//, '/proyectos/')
                .replace(/^\/en\/$/, '/')
            : path;
          const en =
            es === '/' ? '/en/' : es.replace(/^\/proyectos\//, '/en/projects/');
          const alternates = [
            ['es', es],
            ['en', en],
            ['x-default', es],
          ]
            .filter(([, alternate]) => paths.includes(alternate))
            .map(
              ([language, alternate]) =>
                `    <xhtml:link rel="alternate" hreflang="${language}" href="${xml(new URL(alternate, site).href)}" />`,
            )
            .join('\n');
          return `  <url>\n    <loc>${xml(new URL(path, site).href)}</loc>\n${alternates}\n  </url>`;
        });
        await writeFile(
          new URL('sitemap.xml', dir),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`,
        );
        await writeFile(
          new URL('robots.txt', dir),
          `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`,
        );
        logger.info(
          `Generated sitemap.xml for ${paths.length} indexable pages and robots.txt.`,
        );
      },
    },
  };
}
