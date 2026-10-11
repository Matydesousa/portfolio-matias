import { test, expect } from '@playwright/test';
import { publicSite } from '../config/publication.mjs';

test('la URL pública acepta una raíz HTTPS y rechaza configuraciones incompletas', () => {
  expect(publicSite(undefined)).toBeUndefined();
  expect(publicSite('  ')).toBeUndefined();
  expect(publicSite(' https://portfolio.example.test ')).toBe(
    'https://portfolio.example.test/',
  );
  for (const value of [
    'not a URL',
    'http://portfolio.example.test',
    'https://user:password@portfolio.example.test/',
    'https://portfolio.example.test/portfolio/',
    'https://portfolio.example.test/?preview=1',
    'https://portfolio.example.test/#contacto',
  ])
    expect(() => publicSite(value)).toThrow(/PUBLIC_SITE_URL/);
});

test('las páginas de error no se indexan ni anuncian una URL canónica', async ({
  page,
}) => {
  for (const path of ['/404.html', '/en/404/']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );
    await expect(
      page.locator('link[rel="canonical"], meta[property="og:url"]'),
    ).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('404.');
  }
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
