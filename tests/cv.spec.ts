import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const [path, language] of [
  ['/', 'ES'],
  ['/en/', 'EN'],
] as const) {
  for (const width of [1440, 428, 832]) {
    test(`CV ${language}: descarga correcta y contacto responsive (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width,
        height: width === 832 ? 378 : 926,
      });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const filename = `Matias-De-Sousa-CV-${language}.pdf`;
      const cv = page.locator('#contacto a[download]');
      await expect(cv).toHaveAttribute('href', `/cv/${filename}`);
      await expect(cv).toHaveAccessibleName(
        language === 'ES'
          ? 'Descargar mi CV en español (PDF)'
          : 'Download my CV in English (PDF)',
      );
      const contactLinks = await page
        .locator('.contact-links > a')
        .evaluateAll((links) => links.map((link) => link.textContent!.trim()));
      expect(contactLinks.map((text) => text.split(' (')[0])).toEqual([
        'LinkedIn',
        'GitHub',
        language === 'ES' ? 'Descargar CV' : 'Download CV',
      ]);
      await cv.scrollIntoViewIfNeeded();
      const box = await cv.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await cv.focus();
      await expect(cv).toBeFocused();
      const downloaded = page.waitForEvent('download');
      await page.keyboard.press('Enter');
      const download = await downloaded;
      expect(download.suggestedFilename()).toBe(filename);
      expect(await download.failure()).toBeNull();
      const downloadedBytes = await readFile((await download.path())!);
      expect(downloadedBytes.subarray(0, 5).toString()).toBe('%PDF-');
      expect(downloadedBytes).toEqual(await readFile(`public/cv/${filename}`));
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await page.locator('#sobre-mi summary').click();
      const experience = page.locator('.experience-list');
      await expect(experience).toContainText('PHP');
      await expect(experience).toContainText('Laravel');
      await expect(experience).toContainText('Git');
      await expect(experience).toContainText('11');
      await expect(experience).toContainText('9');
      await expect(page.locator('#sobre-mi > p')).toContainText('B2');
      await expect(page.locator('#sobre-mi')).not.toContainText('Adminanzas');
      await expect(page.locator('#sobre-mi')).not.toContainText('MariaDB');
    });
  }
}

test('descarga del CV disponible sin JavaScript y al cambiar idioma', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/`);
    await expect(page.locator('a[download]')).toHaveAttribute(
      'href',
      '/cv/Matias-De-Sousa-CV-ES.pdf',
    );
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await expect(page.locator('a[download]')).toHaveAttribute(
      'href',
      '/cv/Matias-De-Sousa-CV-EN.pdf',
    );
    const downloaded = page.waitForEvent('download');
    await page.locator('a[download]').click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe('Matias-De-Sousa-CV-EN.pdf');
    expect(await download.failure()).toBeNull();
  } finally {
    await context.close();
  }
});
