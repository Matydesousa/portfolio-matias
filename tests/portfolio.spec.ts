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
  const images = await page
    .locator('.repository-thumbnail')
    .evaluateAll((images) =>
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
    '/proyectos/oax-demo/',
    '/proyectos/notas-pendientes/',
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
  await expect(
    page
      .locator('.case-body')
      .getByText(/Desarrollo del modelo educativo en Java/),
  ).toBeVisible();
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
  const atmosphere = page.locator('.ambient-atmosphere');
  await expect(atmosphere).toHaveAttribute('data-active', 'true');
  expect(
    await atmosphere.evaluate(
      (element) => getComputedStyle(element).pointerEvents,
    ),
  ).toBe('none');
  const guideTrigger = page.locator('[data-tour-start]');
  await guideTrigger.scrollIntoViewIfNeeded();
  const beforeHover = await guideTrigger.boundingBox();
  await guideTrigger.hover({ position: { x: 15, y: 12 } });
  await expect(guideTrigger).toHaveAttribute('data-pointer', 'active');
  await expect
    .poll(() =>
      guideTrigger
        .locator('span')
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe('none');
  expect(await guideTrigger.boundingBox()).toEqual(beforeHover);
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('.ambient-canvas')).toBeHidden();
  await expect(atmosphere).toBeHidden();
  await expect(atmosphere).not.toHaveAttribute('data-active', 'true');
  expect(
    await page
      .locator('.ambient-pulse')
      .evaluate((element) => element.getAnimations().length),
  ).toBe(0);
  await page.goto('/proyectos/oax-demo/');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.getByRole('button', { name: 'Activar efectos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(
    page.getByRole('button', { name: 'Movimiento reducido' }),
  ).toBeDisabled();
  await expect(atmosphere).toBeHidden();
  await expect(
    page.getByRole('heading', { name: 'Decisiones técnicas' }),
  ).toBeVisible();
});

test('navegación flotante, parallax decorativo y transiciones respetan pausa e historial', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      const transition = (
        event as Event & { viewTransition?: { ready: Promise<void> } }
      ).viewTransition;
      document.documentElement.dataset.testTransition = 'none';
      transition?.ready.then(
        () => (document.documentElement.dataset.testTransition = 'ready'),
        () => (document.documentElement.dataset.testTransition = 'skipped'),
      );
    });
  });
  await page.goto('/');
  await page.getByRole('link', { name: 'Proyectos', exact: true }).click();
  const header = page.locator('.site-header');
  await expect
    .poll(async () => (await header.boundingBox())!.y)
    .toBeCloseTo(12);
  const heading = await page.locator('#projects-title').boundingBox();
  const navigation = await header.boundingBox();
  expect(heading!.y).toBeGreaterThan(navigation!.y + navigation!.height);
  await expect
    .poll(() =>
      page
        .locator('.ambient-atmosphere')
        .evaluate((element) =>
          parseFloat(
            (element as HTMLElement).style.getPropertyValue('--ambient-shift'),
          ),
        ),
    )
    .toBeGreaterThan(0);
  await page.locator('.repository-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\//);
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-transition',
    'ready',
  );
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await page.getByRole('link', { name: 'Volver a proyectos' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-transition',
    /^(none|skipped)$/,
  );
  expect(
    await page
      .locator('.ambient-atmosphere')
      .evaluate((element) =>
        (element as HTMLElement).style.getPropertyValue('--ambient-shift'),
      ),
  ).toBe('0px');
  await page.goBack();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\//);
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('link', { name: 'Volver a proyectos' }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-test-transition',
    /^(none|skipped)$/,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await header.evaluate((element) => getComputedStyle(element).position),
  ).toBe('relative');
  expect(errors).toEqual([]);
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
  await expect(
    page
      .locator('.case-body')
      .getByText(/Desarrollo del modelo educativo en Java/),
  ).toBeVisible();
  await expect(page.locator('[data-tour-start]')).toBeHidden();
  await expect(page.locator('.page-tour')).toBeHidden();
  await context.close();
});

test('escultura animada y profundidad de las capturas respetan la pausa', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const canvas = page.locator('.ambient-canvas');
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) =>
        element
          .getContext('2d')!
          .getImageData(0, 0, element.width, element.height)
          .data.some((value, index) => index % 4 === 3 && value > 0),
      ),
    )
    .toBe(true);
  const firstFrame = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  );
  await expect
    .poll(() =>
      canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
    )
    .not.toBe(firstFrame);
  await page.goto('/proyectos/notas-pendientes/');
  const stage = page.locator('.image-stage');
  await stage.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator('.case-image')
        .evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe('none');
  await stage.hover({ position: { x: 140, y: 80 } });
  await expect(stage).toHaveAttribute('data-pointer', 'active');
  await expect
    .poll(() =>
      stage.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe('none');
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(stage).not.toHaveAttribute('data-pointer', 'active');
  await expect
    .poll(() =>
      stage.evaluate((element) => getComputedStyle(element).transform),
    )
    .toBe('none');
  const pausedFrame = await canvas.evaluate((element: HTMLCanvasElement) =>
    element.toDataURL(),
  );
  await page.mouse.move(700, 600);
  await expect(canvas).toBeHidden();
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL()),
  ).toBe(pausedFrame);
});

test('figura 3D: clic alterna malla, arrastre directo con captura y pausa cancela el agarre', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/');
  await page.clock.runFor(80);
  const handle = page.getByRole('button', {
    name: 'Cambiar aspecto de la figura 3D',
  });
  await expect(handle).toBeVisible();
  await expect(page.locator('.scene-hint')).toHaveCount(0);
  await handle.click();
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  await page.clock.runFor(2000);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'complete',
  );
  await handle.click();
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  await handle.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  const bounds = await handle.boundingBox();
  await page.mouse.move(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await page.mouse.down();
  await expect(handle).toHaveAttribute('data-dragging', 'true');
  const canvas = page.locator('.ambient-canvas');
  const snapshot = () =>
    canvas.evaluate(
      (element: HTMLCanvasElement & { testFrame?: Uint8ClampedArray }) => {
        element.testFrame = element
          .getContext('2d')!
          .getImageData(0, 0, element.width, element.height).data;
      },
    );
  const changedPixels = () =>
    canvas.evaluate(
      (element: HTMLCanvasElement & { testFrame?: Uint8ClampedArray }) => {
        const frame = element
          .getContext('2d')!
          .getImageData(0, 0, element.width, element.height).data;
        let changed = 0;
        for (let index = 0; index < frame.length; index += 4)
          if (
            [0, 1, 2, 3].some(
              (channel) =>
                Math.abs(
                  frame[index + channel] - element.testFrame![index + channel],
                ) > 8,
            )
          )
            changed++;
        return changed;
      },
    );
  await page.clock.runFor(64);
  await snapshot();
  await page.clock.runFor(64);
  const idleChange = await changedPixels();
  await snapshot();
  // Leave the handle while held: pointer capture must continue rotating the mesh.
  await page.mouse.move(bounds!.x + bounds!.width + 60, bounds!.y + 30, {
    steps: 4,
  });
  await page.clock.runFor(16);
  expect(await changedPixels()).toBeGreaterThan(Math.max(300, idleChange * 4));
  await page.mouse.up();
  await expect(handle).not.toHaveAttribute('data-dragging', 'true');
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  await snapshot();
  await page.clock.runFor(128);
  const momentumChange = await changedPixels();
  await page.clock.runFor(5000);
  await snapshot();
  await page.clock.runFor(128);
  expect(momentumChange).toBeGreaterThan((await changedPixels()) * 2);
  await handle.press('Home');
  await handle.press('ArrowRight');
  await page.mouse.move(bounds!.x + 100, bounds!.y + 100);
  await page.mouse.down();
  await page.getByRole('button', { name: 'Pausar efectos' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveAttribute(
    'data-scene-dragging',
    'true',
  );
  await expect(handle).toBeHidden();
  await page.mouse.up();
  await page.getByRole('button', { name: 'Activar efectos' }).click();
  await expect(handle).toBeVisible();
  await handle.focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(handle).toBeHidden();
  await expect(page.locator('.site-header .brand')).toBeFocused();
  expect(errors).toEqual([]);
});

test('capturas ampliadas: imágenes reales, teclado, cierre y foco en escritorio y móvil', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ['notas-pendientes', 'oax-demo']) {
      await page.goto(`/proyectos/${slug}/`);
      if (width === 390)
        await page.evaluate(
          () => (document.documentElement.style.fontSize = '200%'),
        );
      const trigger = page.getByRole('button', { name: 'Ampliar captura' });
      await trigger.click();
      const viewer = page.locator('.image-viewer');
      await expect(viewer).toBeVisible();
      const close = viewer.getByRole('button', {
        name: 'Cerrar captura ampliada',
      });
      await expect(close).toBeFocused();
      const original = viewer.getByRole('link', {
        name: 'Abrir imagen original',
      });
      await expect(original).toHaveAttribute(
        'href',
        (await page.locator('.image-stage img').getAttribute('src')) || '',
      );
      await expect
        .poll(() =>
          viewer
            .locator('img')
            .evaluate((image: HTMLImageElement) => image.naturalWidth),
        )
        .toBeGreaterThan(0);
      const bounds = await viewer.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
      await page.keyboard.press('Tab');
      await expect(viewer.locator('[data-zoom-in]')).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(close).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(viewer).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.mouse.click(2, 2);
      await expect(viewer).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  }
});

test('visita guiada: desplaza la portada, resalta contenido y abre proyectos reales', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Recorrer el portfolio' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText('Hola, soy Matías');
  await expect(dialog).toHaveAttribute('data-playing', 'true');
  await dialog.getByRole('button', { name: 'Pausar', exact: true }).click();
  const stops = await dialog.evaluate(
    (element) =>
      JSON.parse((element as HTMLElement).dataset.stops!) as {
        target: string;
      }[],
  );
  for (let index = 1; index < stops.length; index++) {
    await dialog.locator('.tour-next').click();
    await expect(dialog).toHaveAttribute('data-target', stops[index].target);
    const geometry = await page.evaluate((selector) => {
      const root = document.querySelector(selector)!;
      const focus =
        document.querySelector<HTMLElement>('.page-tour')!.dataset.focus;
      const target = (
        focus ? root.querySelector(focus)! : root
      ).getBoundingClientRect();
      const spot = document
        .querySelector('.tour-spotlight')!
        .getBoundingClientRect();
      return {
        targetTop: target.top,
        targetBottom: target.bottom,
        spotTop: spot.top,
        spotBottom: spot.bottom,
        height: innerHeight,
        scroll: scrollY,
      };
    }, stops[index].target);
    expect(geometry.targetTop).toBeGreaterThanOrEqual(0);
    expect(geometry.targetTop).toBeLessThan(geometry.height);
    expect(geometry.spotBottom).toBeGreaterThan(geometry.targetTop);
    expect(geometry.spotTop).toBeLessThan(geometry.targetBottom);
    if (stops[index].target === '.experience-list')
      await expect(page.locator('#sobre-mi details')).toHaveAttribute(
        'open',
        '',
      );
  }
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(500);
  await dialog.getByRole('button', { name: 'Terminar' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator('.tour-scroll-space')).toHaveCount(0);
  await expect(page.locator('#sobre-mi details')).not.toHaveAttribute(
    'open',
    '',
  );
  await expect(page.locator('#contacto')).toBeFocused();
  await page.getByRole('button', { name: 'Recorrer el portfolio' }).click();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText(
    'OAX · Gestión comercial',
  );
  await dialog.getByRole('link', { name: 'Ver este proyecto' }).click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\//);
});

test('visitas a los cinco proyectos, teclado y salida con Escape', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const slug of [
    'notas-pendientes',
    'oax-demo',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ]) {
    await page.goto(`/proyectos/${slug}/`);
    await page.getByRole('button', { name: 'Recorrer este proyecto' }).click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('button', { name: 'Cerrar recorrido' }),
    ).toBeFocused();
    await dialog.getByRole('button', { name: 'Pausar', exact: true }).click();
    const advance = dialog.locator('.tour-next');
    const initialButton = await advance.boundingBox();
    const stops = await dialog.evaluate(
      (element) =>
        JSON.parse((element as HTMLElement).dataset.stops!) as {
          target: string;
          focus?: string;
        }[],
    );
    for (const stop of stops.slice(1)) {
      await page.keyboard.press('ArrowRight');
      await expect(dialog).toHaveAttribute('data-target', stop.target);
      await expect(dialog).toHaveAttribute('data-focus', stop.focus || '');
      expect(await advance.boundingBox()).toEqual(initialButton);
      if (stop.target === '.case-header .button')
        await expect(
          dialog.getByRole('link', { name: 'Abrir repositorio' }),
        ).toHaveAttribute('href', /^https:\/\/github.com\/Matydesousa\//);
    }
    await page.keyboard.press('ArrowLeft');
    await expect(dialog).toHaveAttribute(
      'data-target',
      '[aria-labelledby="scope-title"]',
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('[aria-labelledby="scope-title"]')).toBeFocused();
    await expect(
      page.locator('[aria-labelledby="scope-title"]'),
    ).toBeInViewport();
  }
});

test('avance automático, pausa y cambio de preferencia durante la visita', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Recorrer el portfolio' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('data-playing', 'true');
  await page.clock.runFor(900);
  const readingTime = () =>
    dialog.evaluate((el) => Number((el as HTMLElement).dataset.readingTime));
  expect(await readingTime()).toBeGreaterThanOrEqual(8500);
  await page.clock.fastForward((await readingTime()) + 1);
  await expect(dialog.getByRole('heading')).toHaveText(
    'OAX · Gestión comercial',
  );
  await dialog.getByRole('button', { name: 'Pausar', exact: true }).click();
  await page.clock.fastForward(15000);
  await expect(dialog.getByRole('heading')).toHaveText(
    'OAX · Gestión comercial',
  );
  await dialog.getByRole('button', { name: 'Continuar' }).click();
  await page.clock.runFor(900);
  await page.clock.fastForward((await readingTime()) + 1);
  await expect(dialog.getByRole('heading')).toHaveText('Notas y pendientes');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(dialog).toHaveAttribute('data-playing', 'true');
  await dialog
    .getByRole('button', { name: 'Parada siguiente', exact: true })
    .click();
  await expect(dialog.getByRole('heading')).toHaveText('Simulador ferroviario');
  await expect(dialog).toHaveAttribute('data-playing', 'true');
  await dialog
    .getByRole('button', { name: 'Parada anterior', exact: true })
    .click();
  await expect(dialog.getByRole('heading')).toHaveText('Notas y pendientes');
  await page.clock.fastForward((await readingTime()) + 1);
  await expect(dialog.getByRole('heading')).toHaveText('Simulador ferroviario');
  await page.keyboard.press('Escape');
  await page.clock.fastForward(15000);
  await expect(dialog).toBeHidden();
  for (const slug of [
    'oax-demo',
    'notas-pendientes',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ]) {
    await page.goto(`/proyectos/${slug}/`);
    await page.locator('[data-tour-start]').click();
    const tour = page.locator('.page-tour');
    await expect(tour).toHaveAttribute('data-playing', 'true');
    const stops = await tour.evaluate(
      (el) =>
        JSON.parse((el as HTMLElement).dataset.stops!) as {
          target: string;
          focus?: string;
        }[],
    );
    for (const stop of stops.slice(1)) {
      await page.clock.fastForward((await readingTime()) + 1);
      await expect(tour).toHaveAttribute('data-target', stop.target);
      await expect(tour).toHaveAttribute('data-focus', stop.focus || '');
      await expect(tour).toHaveAttribute('data-travelling', 'false');
      await expect(tour).toHaveAttribute('data-playing', 'true');
    }
    await page.clock.fastForward((await readingTime()) + 1);
    await expect(tour).toHaveAttribute('data-playing', 'false');
    await expect(
      tour.getByRole('button', { name: 'Repetir', exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.tour-scroll-space')).toHaveCount(0);
  }
});

test('barra de tiempo: sincroniza pausa, continuación, avance y reinicio', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: new Date('2026-10-09T12:00:00Z') });
  await page.clock.pauseAt(new Date('2026-10-09T12:00:01Z'));
  await page.goto('/');
  await page.locator('[data-tour-start]').click();
  const tour = page.locator('.page-tour');
  const bar = tour.locator('.tour-countdown-fill');
  const duration = await tour.evaluate((el) =>
    Number((el as HTMLElement).dataset.readingTime),
  );
  await page.clock.fastForward(duration / 2);
  await tour.locator('.tour-play').click();
  const paused = await bar.evaluate((el) => getComputedStyle(el).transform);
  const fraction = await bar.evaluate(
    (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).a,
  );
  expect(fraction).toBeCloseTo(0.5, 2);
  expect(await bar.evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.clock.fastForward(duration);
  expect(await bar.evaluate((el) => getComputedStyle(el).transform)).toBe(
    paused,
  );
  await expect(tour).toHaveAttribute('data-target', '.intro h1');
  await tour.locator('.tour-play').click();
  const remaining = await bar.evaluate((el) =>
    Number(el.getAnimations()[0].effect!.getTiming().duration),
  );
  expect(remaining).toBeCloseTo(duration * fraction, 0);
  await page.clock.fastForward(remaining - 1);
  await expect(tour).toHaveAttribute('data-target', '.intro h1');
  await page.clock.fastForward(1);
  await expect(tour.getByRole('heading')).toHaveText('OAX · Gestión comercial');
  expect(
    await bar.evaluate(
      (el) =>
        (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes()[0]
          .transform,
    ),
  ).toBe('scaleX(1)');
  await page.clock.fastForward(2000);
  await tour.locator('.tour-previous').click();
  await expect(tour).toHaveAttribute('data-target', '.intro h1');
  expect(
    await bar.evaluate(
      (el) =>
        (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes()[0]
          .transform,
    ),
  ).toBe('scaleX(1)');
  await page.keyboard.press('Escape');
  // Native dialog.close dispatches its cleanup event asynchronously.
  await expect(tour).toBeHidden();
  await expect
    .poll(() => bar.evaluate((el) => el.getAnimations().length))
    .toBe(0);
  await page.clock.fastForward(duration * 2);
  await expect(tour).toBeHidden();
});

test('barra en el borde del mensaje en portada y cinco proyectos, móvil y escritorio', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      '/',
      '/proyectos/oax-demo/',
      '/proyectos/notas-pendientes/',
      '/proyectos/simulador-ferroviario/',
      '/proyectos/simulador-bancario/',
      '/proyectos/gestion-hotel/',
    ]) {
      await page.goto(path);
      await page.locator('[data-tour-start]').click();
      const geometry = await page.locator('.tour-card').evaluate((card) => {
        const c = card.getBoundingClientRect();
        const b = card
          .querySelector('.tour-countdown')!
          .getBoundingClientRect();
        return {
          contained: b.left > c.left && b.right < c.right,
          top: b.top - c.top,
          height: b.height,
          horizontal: card.scrollWidth > card.clientWidth,
        };
      });
      expect(geometry.contained).toBe(true);
      expect(geometry.top).toBeCloseTo(1);
      expect(geometry.height).toBe(2);
      expect(geometry.horizontal).toBe(false);
      await page.keyboard.press('Escape');
    }
  }
});

test('transiciones interrumpidas: navegación rápida, resize y cierre sin desplazamiento tardío', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.locator('[data-tour-start]').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('data-travelling', 'false');
  const button = await dialog.locator('.tour-next').boundingBox();
  expect(button).not.toBeNull();
  // The same cursor location must advance again while the message is moving.
  for (let index = 0; index < 2; index++)
    await page.mouse.click(
      button!.x + button!.width / 2,
      button!.y + button!.height / 2,
    );
  for (let index = 0; index < 2; index++)
    await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('heading')).toHaveText('Simulador bancario');
  await expect(dialog).toHaveAttribute('data-travelling', 'true');
  expect(await dialog.locator('.tour-next').boundingBox()).toEqual(button);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toHaveAttribute('data-travelling', 'false');
  const position = await page.evaluate(() => {
    const selector =
      document.querySelector<HTMLElement>('.page-tour')!.dataset.target!;
    const target = document.querySelector(selector)!.getBoundingClientRect();
    const spot = document
      .querySelector('.tour-spotlight')!
      .getBoundingClientRect();
    const card = document.querySelector('.tour-card')!.getBoundingClientRect();
    return {
      targetTop: target.top,
      spotTop: spot.top,
      spotBottom: spot.bottom,
      cardLeft: card.left,
      cardRight: card.right,
      cardBottom: card.bottom,
    };
  });
  expect(position.targetTop).toBeGreaterThanOrEqual(0);
  expect(position.spotTop).toBeLessThan(position.targetTop);
  expect(position.spotBottom).toBeGreaterThan(position.targetTop);
  expect(position.cardLeft).toBeGreaterThanOrEqual(0);
  expect(position.cardRight).toBeLessThanOrEqual(390);
  expect(position.cardBottom).toBeLessThanOrEqual(844);
  await page.keyboard.press('ArrowRight');
  await expect(dialog).toHaveAttribute('data-travelling', 'true');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  const stoppedAt = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => scrollY)).toBe(stoppedAt);
  expect(errors).toEqual([]);
});

for (const width of [320, 390, 768, 1440]) {
  test(`mensajes y controles caben a ${width} px${width === 390 ? ' con texto al 200 %' : ''}`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      '/',
      '/proyectos/oax-demo/',
      '/proyectos/notas-pendientes/',
      '/proyectos/simulador-ferroviario/',
      '/proyectos/simulador-bancario/',
      '/proyectos/gestion-hotel/',
    ]) {
      await page.goto(path);
      if (width === 390)
        await page.evaluate(
          () => (document.documentElement.style.fontSize = '200%'),
        );
      await page.locator('[data-tour-start]').click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('button', { name: 'Pausar', exact: true }).click();
      const advance = dialog.locator('.tour-next');
      const initialButton = await advance.boundingBox();
      const count = await dialog.evaluate(
        (element) =>
          JSON.parse((element as HTMLElement).dataset.stops!).length as number,
      );
      for (let index = 0; index < count; index++) {
        await expect(async () => {
          const bounds = await page.locator('.tour-card').boundingBox();
          expect(bounds).not.toBeNull();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
          expect(bounds!.y).toBeGreaterThanOrEqual(0);
          expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
          const button = await advance.boundingBox();
          expect(button).toEqual(initialButton);
          expect(button!.x + button!.width).toBeCloseTo(width - 20);
          expect(button!.y + button!.height).toBeCloseTo(824);
          expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
            button!.y - 12,
          );
          const geometry = await dialog.evaluate((el) => {
            const card = el.querySelector<HTMLElement>('.tour-card')!;
            const copy = el.querySelector<HTMLElement>('.tour-copy')!;
            const target = document.querySelector<HTMLElement>(
              (el as HTMLElement).dataset.target!,
            )!;
            const focus = (el as HTMLElement).dataset.focus;
            const rect = (
              focus ? target.querySelector(focus)! : target
            ).getBoundingClientRect();
            const spot = el
              .querySelector('.tour-spotlight')!
              .getBoundingClientRect();
            const c = card.getBoundingClientRect();
            return {
              horizontal:
                card.scrollWidth > card.clientWidth ||
                copy.scrollWidth > copy.clientWidth,
              overlap:
                Math.max(
                  0,
                  Math.min(c.right, spot.right) - Math.max(c.left, spot.left),
                ) *
                Math.max(
                  0,
                  Math.min(c.bottom, spot.bottom) - Math.max(c.top, spot.top),
                ),
              aligned:
                spot.right > rect.left &&
                spot.left < rect.right &&
                spot.bottom > rect.top &&
                spot.top < rect.bottom,
              complete:
                !target.closest('.case-main') ||
                (spot.left <= rect.left &&
                  spot.top <= rect.top &&
                  spot.right >= rect.right &&
                  spot.bottom >= rect.bottom &&
                  spot.left >= 0 &&
                  spot.top >= 0 &&
                  spot.right <= innerWidth &&
                  spot.bottom <= innerHeight),
            };
          });
          expect(geometry.horizontal).toBe(false);
          expect(geometry.overlap).toBe(0);
          expect(geometry.aligned).toBe(true);
          expect(geometry.complete).toBe(true);
        }).toPass();
        if (index < count - 1) await dialog.locator('.tour-next').click();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
    }
  });
}

test('encuadres de proyecto: imágenes completas, bloques individuales y restauración', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1255, height: 780 });
  for (const slug of [
    'oax-demo',
    'notas-pendientes',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ]) {
    await page.goto(`/proyectos/${slug}/`);
    const originalImage = await page
      .locator('.case-image .image-stage')
      .boundingBox();
    await page.locator('[data-tour-start]').click();
    const tour = page.locator('.page-tour');
    await tour.locator('.tour-play').click();
    const stops = await tour.evaluate(
      (el) =>
        JSON.parse((el as HTMLElement).dataset.stops!) as {
          target: string;
          focus?: string;
        }[],
    );
    expect(
      stops.filter((stop) => stop.target.includes('features-title')),
    ).toHaveLength(await page.locator('.project-features > div').count());
    expect(
      stops.filter((stop) => stop.focus?.startsWith('.workflow-list > li')),
    ).toHaveLength(await page.locator('.workflow-list > li').count());
    expect(stops.some((stop) => stop.focus === '.project-example')).toBe(true);
    for (let i = 0; i < stops.length; i++) {
      if (i) await tour.locator('.tour-next').click();
      if (stops[i].target !== '.case-image') continue;
      const geometry = await page.evaluate(() => {
        const image =
          document.querySelector<HTMLImageElement>('.case-image img')!;
        const stage = document
          .querySelector('.case-image .image-stage')!
          .getBoundingClientRect();
        const img = image.getBoundingClientRect();
        const spot = document
          .querySelector('.tour-spotlight')!
          .getBoundingClientRect();
        const card = document
          .querySelector('.tour-card')!
          .getBoundingClientRect();
        return {
          ratio: img.width / img.height,
          originalRatio: image.naturalWidth / image.naturalHeight,
          complete:
            spot.top <= img.top &&
            spot.bottom >= img.bottom &&
            spot.left <= img.left &&
            spot.right >= img.right,
          stageHeight: stage.height,
          imageHeight: img.height,
          overlap:
            Math.max(
              0,
              Math.min(card.right, img.right) - Math.max(card.left, img.left),
            ) *
            Math.max(
              0,
              Math.min(card.bottom, img.bottom) - Math.max(card.top, img.top),
            ),
        };
      });
      expect(geometry.complete).toBe(true);
      expect(geometry.ratio).toBeCloseTo(geometry.originalRatio, 2);
      expect(geometry.stageHeight).toBeCloseTo(geometry.imageHeight, 0);
      expect(geometry.overlap).toBe(0);
    }
    await page.keyboard.press('Escape');
    expect(
      await page.locator('.case-image .image-stage').boundingBox(),
    ).toMatchObject({
      width: originalImage!.width,
      height: originalImage!.height,
    });
    await expect(
      page.locator('.tour-focus-image, .tour-focus-window'),
    ).toHaveCount(0);
  }
});

test('encuadres animados en ventana baja: imagen, función y flujo de los cinco proyectos', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1004, height: 624 });
  for (const slug of [
    'oax-demo',
    'notas-pendientes',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ]) {
    await page.goto(`/proyectos/${slug}/`);
    await page.locator('[data-tour-start]').click();
    const tour = page.locator('.page-tour');
    await tour.locator('.tour-play').click();
    const stops = await tour.evaluate(
      (el) =>
        JSON.parse((el as HTMLElement).dataset.stops!) as {
          target: string;
          focus?: string;
        }[],
    );
    let current = 0;
    for (const desired of [
      '.image-stage',
      '.project-features > div:nth-child(3)',
      '.workflow-list > li:nth-child(3)',
    ]) {
      const index = stops.findIndex((stop) => stop.focus === desired);
      for (; current < index; current++)
        await tour.locator('.tour-next').click();
      await expect(tour).toHaveAttribute('data-travelling', 'false');
      const geometry = await tour.evaluate((el) => {
        const root = document.querySelector(
          (el as HTMLElement).dataset.target!,
        )!;
        const f = root
          .querySelector((el as HTMLElement).dataset.focus!)!
          .getBoundingClientRect();
        const s = el.querySelector('.tour-spotlight')!.getBoundingClientRect();
        const c = el.querySelector('.tour-card')!.getBoundingClientRect();
        return {
          complete:
            s.left <= f.left &&
            s.top <= f.top &&
            s.right >= f.right &&
            s.bottom >= f.bottom,
          fits:
            s.left >= 0 &&
            s.top >= 0 &&
            s.right <= innerWidth &&
            s.bottom <= innerHeight &&
            c.left >= 0 &&
            c.top >= 0 &&
            c.right <= innerWidth &&
            c.bottom <= innerHeight,
          overlap:
            Math.max(0, Math.min(c.right, s.right) - Math.max(c.left, s.left)) *
            Math.max(0, Math.min(c.bottom, s.bottom) - Math.max(c.top, s.top)),
        };
      });
      expect(geometry.complete).toBe(true);
      expect(geometry.fits).toBe(true);
      expect(geometry.overlap).toBe(0);
    }
    await page.keyboard.press('Escape');
  }
});

test('contenido alto en el recorrido: lectura con rueda, teclado y gesto táctil', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/proyectos/oax-demo/');
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  await page.locator('[data-tour-start]').click();
  const tour = page.locator('.page-tour');
  const stops = await tour.evaluate(
    (el) => JSON.parse((el as HTMLElement).dataset.stops!).length as number,
  );
  for (let i = 0; i < stops - 2; i++) await tour.locator('.tour-next').click();
  const content = page.locator('.tour-focus-window');
  await expect(content).toHaveCount(1);
  const before = await content.evaluate((el) => el.scrollTop);
  await page.locator('.tour-spotlight').hover();
  await page.mouse.wheel(0, 120);
  await expect
    .poll(() => content.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(before);
  await expect(tour).toHaveAttribute('data-playing', 'false');
  await content.evaluate((el) => (el.scrollTop = 0));
  await page.locator('.tour-spotlight').focus();
  await page.keyboard.press('PageDown');
  const afterKeyboard = await content.evaluate((el) => el.scrollTop);
  expect(afterKeyboard).toBeGreaterThan(0);
  expect(afterKeyboard).toBeLessThanOrEqual(
    await content.evaluate((el) => el.scrollHeight - el.clientHeight),
  );
  await page.keyboard.press('PageUp');
  expect(await content.evaluate((el) => el.scrollTop)).toBeLessThan(
    afterKeyboard,
  );
  await content.evaluate((el) => (el.scrollTop = 0));
  const bounds = await page.locator('.tour-spotlight').boundingBox();
  await page.mouse.move(bounds!.x + 30, bounds!.y + 80);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 30, bounds!.y + 20);
  await page.mouse.up();
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await content.evaluate((el) => (el.scrollTop = 0));
  const touch = await page.context().newCDPSession(page);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: bounds!.x + 30, y: bounds!.y + 80 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: bounds!.x + 30, y: bounds!.y + 20 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await touch.detach();
  expect(await content.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour-focus-window')).toHaveCount(0);
});
