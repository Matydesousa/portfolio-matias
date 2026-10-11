import { test, expect } from '@playwright/test';

async function settleScroll(page: import('@playwright/test').Page, y: number) {
  await page.evaluate(async (top) => {
    window.scrollTo({ top, behavior: 'instant' });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  }, y);
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-scroll-settling',
  );
}

async function layoutTop(
  page: import('@playwright/test').Page,
  selector: string,
) {
  return page.locator(selector).evaluate((element) => {
    let top = 0;
    let current = element as HTMLElement | null;
    while (current) {
      top += current.offsetTop;
      current = current.offsetParent as HTMLElement | null;
    }
    return top;
  });
}

test('el scroll muestra y oculta con la misma curva 3D en ambas direcciones', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const selector = '.repository-list > li:nth-child(3)';
  const row = page.locator(selector);
  const top = await layoutTop(page, selector);
  await settleScroll(page, top - 800);
  await expect
    .poll(() => row.evaluate((el) => parseFloat(getComputedStyle(el).opacity)))
    .toBeLessThan(1);
  const first = await row.evaluate((el) => {
    const style = getComputedStyle(el);
    const matrix = new DOMMatrix(style.transform);
    return { opacity: +style.opacity, z: matrix.m43, tilt: matrix.m23 };
  });
  expect(first.z).toBeLessThan(-20);
  expect(Math.abs(first.tilt)).toBeGreaterThan(0.02);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    top - 700,
  );
  await expect
    .poll(() => row.evaluate((el) => +getComputedStyle(el).opacity))
    .toBeGreaterThan(first.opacity);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    top - 500,
  );
  await expect(row).toHaveClass(/is-revealed/);
  expect(await row.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  await settleScroll(page, top - 800);
  await expect(row).not.toHaveClass(/is-revealed/);
  await expect
    .poll(() => row.evaluate((el) => +getComputedStyle(el).opacity))
    .toBeCloseTo(first.opacity, 3);
  const reversed = await row.evaluate((el) => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return { z: matrix.m43, tilt: matrix.m23 };
  });
  expect(reversed.z).toBeCloseTo(first.z, 3);
  expect(reversed.tilt).toBeCloseTo(first.tilt, 3);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    top - 950,
  );
  await expect
    .poll(() => row.evaluate((el) => +getComputedStyle(el).opacity))
    .toBeLessThan(first.opacity);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' }),
    top - 500,
  );
  await expect(row).toHaveClass(/is-revealed/);
});

test('el pie termina su entrada al llegar al final de la página', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    }),
  );
  const footer = page.locator('.site-footer');
  await expect(footer).toHaveClass(/is-revealed/);
  expect(await footer.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  expect(await footer.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  const bottom = await page.evaluate(() => scrollY);
  await settleScroll(page, bottom - 15);
  await expect(footer).not.toHaveClass(/is-revealed/);
  const nearEnd = await footer.evaluate((el) => +getComputedStyle(el).opacity);
  expect(nearEnd).toBeGreaterThan(0.8);
  await page.evaluate(
    (y) => scrollTo({ top: y - 30, behavior: 'instant' }),
    bottom,
  );
  await expect
    .poll(() => footer.evaluate((el) => +getComputedStyle(el).opacity))
    .toBeLessThan(nearEnd);
});

test('amortiguación breve, capas independientes y cobertura de bloques sin bucle ocioso', async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.clock.runFor(100);
  const row = page.locator('.repository-list > li:nth-child(3)');
  const top = await layoutTop(page, '.repository-list > li:nth-child(3)');
  await page.evaluate(
    (y) => scrollTo({ top: y - 800, behavior: 'instant' }),
    top,
  );
  await page.clock.runFor(700);
  const opacity = () => row.evaluate((el) => +getComputedStyle(el).opacity);
  const before = await opacity();
  await page.evaluate(
    (y) => scrollTo({ top: y - 640, behavior: 'instant' }),
    top,
  );
  await page.clock.runFor(32);
  const moving = await opacity();
  expect(moving).toBeGreaterThan(before);
  await expect(page.locator('html')).toHaveAttribute('data-scroll-settling');
  expect(await row.evaluate((el) => getComputedStyle(el).willChange)).toContain(
    'transform',
  );
  await page.clock.runFor(700);
  expect(await opacity()).toBeGreaterThan(moving);
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-scroll-settling',
  );
  expect(await row.evaluate((el) => getComputedStyle(el).willChange)).toBe(
    'auto',
  );
  const layers = await row.evaluate((el) => ({
    thumbnail: getComputedStyle(el.querySelector('.thumbnail-frame')!)
      .translate,
    text: getComputedStyle(el.querySelector('.repository-info')!).translate,
  }));
  expect(parseFloat(layers.thumbnail.split(' ')[1])).toBeLessThan(0);
  expect(parseFloat(layers.text.split(' ')[1])).toBeGreaterThan(0);
  for (const selector of [
    '.intro > h1',
    '.intro-description',
    '.about summary',
    '.experience-list',
    '.project-ribbon',
  ]) {
    await expect(page.locator(selector).first()).toHaveClass(/motion-reveal/);
  }
  await expect(page.locator('.motion-reveal .motion-reveal')).toHaveCount(0);
  await page.goto('/en/projects/oax-demo/');
  for (const selector of [
    '.back-link',
    '.case-header > h1',
    '.tags',
    '.case-actions',
    '.case-image',
    '.project-ribbon',
  ]) {
    await expect(page.locator(selector)).toHaveClass(/motion-reveal/);
  }
  await expect(page.locator('.motion-reveal .motion-reveal')).toHaveCount(0);
});

test('pausa, movimiento reducido, teclado y ausencia de JS mantienen contenido normal', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const selector = '.repository-list > li:nth-child(4)';
  const row = page.locator(selector);
  await row.locator('a').focus();
  await expect(row).toHaveClass(/is-revealed/);
  expect(await row.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  await page.locator('.motion-toggle').click();
  const contact = page.locator('.contact > div').first();
  expect(await contact.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  expect(await contact.evaluate((el) => getComputedStyle(el).opacity)).toBe(
    '1',
  );
  await page.locator('.motion-toggle').click();
  await expect
    .poll(() => contact.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe('none');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/projects/oax-demo/');
  expect(
    await page
      .locator('.gallery-grid li')
      .first()
      .evaluate((el) => getComputedStyle(el).transform),
  ).toBe('none');
  const plain = await browser.newPage({ javaScriptEnabled: false });
  await plain.goto('/proyectos/oax-demo/');
  expect(
    await plain
      .locator('.project-features > div')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity),
  ).toBe('1');
  await expect(plain.locator('.gallery-link').first()).toHaveAttribute(
    'href',
    /^\/images\//,
  );
  await plain.close();
});

test('experiencia: clic estable durante la entrada y contenido desplegado integrado al scroll', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const summary = page.locator('.about summary');
    const top = await layoutTop(page, '.about summary');
    await settleScroll(page, top - 650);
    expect(
      await summary.evaluate((el) => getComputedStyle(el).transform),
    ).not.toBe('none');
    await summary.click();
    await expect(page.locator('details')).toHaveAttribute('open', '');
    await expect(page.locator('.experience-signal')).toBeVisible();
    const item = page.locator('.experience-list');
    const itemTop = await layoutTop(page, '.experience-list');
    await settleScroll(page, itemTop - 720);
    expect(
      await item.evaluate((el) => +getComputedStyle(el).opacity),
    ).toBeLessThan(1);
    await settleScroll(page, itemTop - 450);
    await expect(item).toHaveClass(/is-revealed/);
    await summary.click();
    await expect(page.locator('details')).not.toHaveAttribute('open');
    await expect(page.locator('.experience-signal')).toHaveCount(0);
  }
});

test('portadas y cinco proyectos en ambos idiomas, móvil y texto ampliado sin desbordamientos', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const slugs = [
    'oax-demo',
    'notas-pendientes',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['es', 'en']) {
      for (const slug of ['', ...slugs]) {
        const path = slug
          ? `${locale === 'en' ? '/en/projects' : '/proyectos'}/${slug}/`
          : locale === 'en'
            ? '/en/'
            : '/';
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        if (width === 390)
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '200%';
          });
        const selector = slug
          ? '.project-features > div:first-child'
          : '.repository-list > li:nth-child(3)';
        const target = page.locator(selector);
        await expect(target).toHaveClass(/motion-reveal/);
        const top = await layoutTop(page, selector);
        await page.evaluate(
          (y) =>
            window.scrollTo({ top: Math.max(0, y - 750), behavior: 'instant' }),
          top,
        );
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
          .toBeLessThanOrEqual(width);
        await page.evaluate(
          (y) => window.scrollTo({ top: y - 450, behavior: 'instant' }),
          top,
        );
        await expect(target).toHaveClass(/is-revealed/);
        await page.evaluate(
          (y) =>
            window.scrollTo({ top: Math.max(0, y - 800), behavior: 'instant' }),
          top,
        );
        await expect(target).not.toHaveClass(/is-revealed/);
        await page.evaluate(
          (y) => window.scrollTo({ top: y - 450, behavior: 'instant' }),
          top,
        );
        await expect(target).toHaveClass(/is-revealed/);
        if (slug) {
          await expect(page.locator('.gallery-grid > li').first()).toHaveClass(
            /motion-reveal/,
          );
          await expect(page.locator('.workflow-list > li').first()).toHaveClass(
            /motion-reveal/,
          );
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

test('el visor suspende las entradas y restaura el encuadre al cerrar', async ({
  page,
}) => {
  await page.goto('/proyectos/oax-demo/');
  await page.locator('[data-image-open]').click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-scroll-depth',
    'off',
  );
  const feature = page.locator('.project-features > div').first();
  expect(await feature.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
  expect(await feature.evaluate((el) => getComputedStyle(el).opacity)).toBe(
    '1',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-scroll-depth', 'on');
  expect(
    await page
      .locator('[data-image-open]')
      .evaluate((el) => el === document.activeElement),
  ).toBe(true);
});
