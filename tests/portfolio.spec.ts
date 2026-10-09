import { test, expect } from '@playwright/test';

test('navegación, miniaturas y páginas de proyectos', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Matías De Sousa/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  await expect(page).toHaveURL(/#proyectos/);
  await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
    'href',
    'mailto:matydesousa06@gmail.com',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  const images = await page.locator('main img').evaluateAll((images) =>
    images.map((image) => ({
      loaded:
        (image as HTMLImageElement).complete &&
        (image as HTMLImageElement).naturalWidth > 0,
      alt: image.getAttribute('alt'),
    })),
  );
  expect(images).toHaveLength(5);
  await expect(page.locator('.repository-link')).toHaveCount(5);
  expect(images.every((image) => image.loaded && image.alt)).toBe(true);
  const paths = [
    '/proyectos/notas-pendientes/',
    '/proyectos/oax-demo/',
    '/proyectos/simulador-ferroviario/',
    '/proyectos/simulador-bancario/',
    '/proyectos/gestion-hotel/',
  ];
  expect(
    await page
      .locator('.repository-link')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
  ).toEqual(paths);
  await page
    .getByRole('link', { name: 'Notas y pendientes', exact: true })
    .click();
  await expect(page).toHaveURL(/\/proyectos\/notas-pendientes\//);
  for (const path of paths) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Decisiones técnicas' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Ver repositorio en GitHub/ }),
    ).toHaveAttribute('href', /^https:\/\/github.com\/Matydesousa\//);
  }
  await page.goto('/proyectos/simulador-bancario/');
  await expect(page.getByText(/Nahue Campos/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('sin desbordamientos en escritorio, tablet y móvil', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/proyectos/notas-pendientes/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        page: document.documentElement.scrollWidth,
      }));
      expect(overflow.page, `${path} en ${width}px`).toBeLessThanOrEqual(
        overflow.viewport,
      );
    }
  }
});

test('teclado, movimiento reducido y enlaces internos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Saltar al contenido' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#contenido/);
  expect(
    await page
      .locator('html')
      .evaluate((element) => getComputedStyle(element).scrollBehavior),
  ).toBe('auto');
  const broken = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute('href')!)
        .filter((href) => !document.getElementById(href.slice(1))),
    );
  expect(broken).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test('efectos interactivos, pausa persistente y preferencia del sistema', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  const row = page.locator('.repository-link').first();
  await row.scrollIntoViewIfNeeded();
  const bounds = await row.boundingBox();
  if (!bounds) throw new Error('No se encontró la fila de proyecto');
  await page.mouse.move(
    bounds.x + bounds.width * 0.7,
    bounds.y + bounds.height * 0.4,
  );
  await expect(row).toHaveAttribute('data-pointer', 'active');
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.ambient-canvas')).toBeHidden();
  await page.goto('/proyectos/oax-demo/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.getByRole('button', { name: 'Activar efectos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(
    page.getByRole('button', { name: 'Movimiento reducido' }),
  ).toBeDisabled();
  await expect(
    page.getByRole('heading', { name: 'Decisiones técnicas' }),
  ).toBeVisible();
});

test('el portfolio y sus enlaces funcionan sin JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.locator('.repository-link')).toHaveCount(5);
  await expect(
    page.getByRole('heading', { name: 'Matías De Sousa', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Simulador bancario', exact: true })
    .click();
  await expect(page.getByText(/Nahue Campos/)).toBeVisible();
  await context.close();
});
