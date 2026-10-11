import { test, expect } from '@playwright/test';

test('los cinco proyectos explican funciones y flujo, con galerías propias y proporciones reales', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const cases = [
    { slug: 'oax-demo', count: 5, width: 1440, height: 960 },
    { slug: 'notas-pendientes', count: 3, width: 1440, height: 960 },
    { slug: 'simulador-ferroviario', count: 4, width: 1202, height: 940 },
    { slug: 'simulador-bancario', count: 1, width: 1440, height: 960 },
    { slug: 'gestion-hotel', count: 2, width: 1440, height: 960 },
  ];
  for (const viewportWidth of [1280, 390]) {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    for (const item of cases) {
      await page.goto(`/proyectos/${item.slug}/`);
      await expect(page.locator('.project-features dt')).toHaveCount(4);
      await expect(page.locator('.workflow-list li')).toHaveCount(3);
      await expect(page.locator('.project-example p')).not.toBeEmpty();
      const main = page.locator('.image-stage img');
      await expect(main).toHaveAttribute('width', String(item.width));
      await expect(main).toHaveAttribute('height', String(item.height));
      await expect
        .poll(() => main.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe(item.width);
      const cards = page.locator('.gallery-link');
      await expect(cards).toHaveCount(item.count);
      await expect(page.locator('.gallery-description')).toHaveCount(
        item.count,
      );
      if (item.slug !== 'oax-demo')
        await expect(page.locator('.project-gallery')).not.toContainText(
          'sitio de OAX',
        );
      for (const card of await cards.all()) {
        await card.click();
        const viewer = page.locator('.image-viewer');
        await expect(viewer).toBeVisible();
        const image = viewer.locator('img');
        const source = (await card.getAttribute('href'))!;
        await expect(image).toHaveAttribute('src', source);
        await expect
          .poll(() =>
            image.evaluate((img: HTMLImageElement) => img.naturalWidth),
          )
          .toBe(item.width);
        await expect(image).toHaveAttribute('width', String(item.width));
        await expect(image).toHaveAttribute('height', String(item.height));
        await expect(viewer.locator('#image-viewer-caption')).toContainText(
          (await card.locator('.gallery-description').textContent())!,
        );
        await page.keyboard.press('Escape');
        await expect(card).toBeFocused();
      }
      const last = cards.last().locator('img');
      const bounds = await last.boundingBox();
      expect(bounds!.width / bounds!.height).toBeCloseTo(
        item.width / item.height,
        2,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(viewportWidth);
      if (item.slug === 'simulador-bancario') {
        await expect(
          page.locator('[aria-labelledby="scope-title"]'),
        ).toContainText('consola');
      }
    }
  }
  expect(errors).toEqual([]);
});

test('OAX: enlaces verificados, galería, teclado, cierre y foco en escritorio y móvil', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/proyectos/oax-demo/');
    await expect(
      page.getByRole('link', { name: /Visitar OAX/ }),
    ).toHaveAttribute('href', 'https://oax-sistemas.com.ar/');
    await expect(
      page.getByRole('link', { name: /Probar demo/ }),
    ).toHaveAttribute('href', 'https://oax-sistemas.com.ar/demo');
    const cards = page.locator('.gallery-link');
    await expect(cards).toHaveCount(5);
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    if (width > 700) {
      expect(first!.width).toBeGreaterThan(350);
      expect(second!.y).toBeCloseTo(first!.y, 0);
      expect(second!.x).toBeGreaterThan(first!.x);
    } else {
      expect(second!.y).toBeGreaterThan(first!.y);
    }
    for (let index = 0; index < 5; index++) {
      const card = cards.nth(index);
      await card.click();
      const viewer = page.locator('.image-viewer');
      await expect(viewer).toBeVisible();
      await expect(viewer.locator('.image-counter')).toHaveText(
        `${index + 2} de 6`,
      );
      await expect(viewer.locator('img')).toHaveAttribute(
        'src',
        (await card.getAttribute('href'))!,
      );
      await expect(viewer.locator('img')).toHaveAttribute(
        'alt',
        (await card.locator('img').getAttribute('alt'))!,
      );
      await expect(viewer.locator('.image-original')).toHaveAttribute(
        'href',
        (await card.getAttribute('href'))!,
      );
      await expect
        .poll(() =>
          viewer
            .locator('img')
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBe(1440);
      await page.keyboard.press('ArrowRight');
      await expect(viewer.locator('.image-counter')).toHaveText(
        `${((index + 2) % 6) + 1} de 6`,
      );
      await page.keyboard.press('ArrowLeft');
      await expect(viewer.locator('.image-counter')).toHaveText(
        `${index + 2} de 6`,
      );
      await expect(
        viewer.getByRole('button', { name: 'Cerrar captura ampliada' }),
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(viewer).toBeHidden();
      await expect(card).toBeFocused();
    }
    await cards.first().click();
    const viewer = page.locator('.image-viewer');
    await viewer.getByRole('button', { name: 'Imagen anterior' }).click();
    await expect(viewer.locator('.image-counter')).toHaveText('1 de 6');
    await viewer.getByRole('button', { name: 'Imagen siguiente' }).click();
    await expect(viewer.locator('.image-counter')).toHaveText('2 de 6');
    await page.keyboard.press('Escape');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});

test('galerías sin JavaScript y visor con fuente al 200 %', async ({
  browser,
  page,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const plain = await context.newPage();
    for (const [slug, count] of [
      ['oax-demo', 5],
      ['notas-pendientes', 3],
      ['simulador-ferroviario', 4],
      ['simulador-bancario', 1],
      ['gestion-hotel', 2],
    ] as const) {
      await plain.goto(`/proyectos/${slug}/`);
      await expect(plain.locator('.gallery-link')).toHaveCount(count);
      await expect(plain.locator('.workflow-list')).toBeVisible();
      for (const card of await plain.locator('.gallery-link').all()) {
        const href = (await card.getAttribute('href'))!;
        const response = await plain.request.get(
          `http://127.0.0.1:4321${href}`,
        );
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toMatch(
          /^image\/(jpeg|png)/,
        );
        await expect(card).not.toHaveAttribute('aria-haspopup', 'dialog');
      }
      await expect(plain.locator('[data-image-open]')).toBeHidden();
      expect(
        await plain.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(390);
    }
  } finally {
    await context.close();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const slug of ['oax-demo', 'simulador-ferroviario']) {
    await page.goto(`/proyectos/${slug}/`);
    await page.evaluate(
      () => (document.documentElement.style.fontSize = '200%'),
    );
    await page.locator('.gallery-link').last().click();
    await page
      .locator('.image-viewer')
      .getByRole('button', { name: 'Imagen siguiente' })
      .click();
    const viewer = await page.locator('.image-viewer').boundingBox();
    expect(viewer!.x).toBeGreaterThanOrEqual(0);
    expect(viewer!.x + viewer!.width).toBeLessThanOrEqual(390);
    expect(viewer!.y + viewer!.height).toBeLessThanOrEqual(844);
    await page.keyboard.press('Escape');
    await expect(page.locator('.gallery-link').last()).toBeFocused();
  }
});
