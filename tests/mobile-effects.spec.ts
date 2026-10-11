import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/proyectos/oax-demo/',
  '/proyectos/notas-pendientes/',
  '/proyectos/simulador-ferroviario/',
  '/proyectos/simulador-bancario/',
  '/proyectos/gestion-hotel/',
  '/en/',
  '/en/projects/oax-demo/',
];

test('cinta móvil: caras legibles, giro tras tocar, colores y navegación en todas las vistas', async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
    const ribbon = page.locator('.project-ribbon');
    await ribbon.scrollIntoViewIfNeeded();
    await page.clock.runFor(700);
    await expect(ribbon).toHaveAttribute('data-running', 'true');
    const viewport = ribbon.locator('.ribbon-viewport');
    if (page.viewportSize()!.width <= 700) {
      const size = await ribbon.evaluate((el) => ({
        card: el.querySelector<HTMLElement>('.ribbon-card')!.offsetWidth,
        surface: el.querySelector<HTMLElement>('.ribbon-viewport')!.clientWidth,
      }));
      expect(size.card).toBeLessThanOrEqual(size.surface * 0.5);
      await expect(ribbon).toHaveAttribute('data-projected');
      const curve = await ribbon
        .locator('.ribbon-segment')
        .evaluateAll((nodes) => {
          const heights = nodes.map(
            (el) => new DOMMatrix(getComputedStyle(el).transform).m42,
          );
          return Math.max(...heights) - Math.min(...heights);
        });
      expect(curve).toBeGreaterThan(20);
    }
    const tapSurface = async () => {
      const box = (await viewport.boundingBox())!;
      await page.touchscreen.tap(
        box.x + 12,
        Math.min(box.y + box.height - 4, page.viewportSize()!.height - 4),
      );
    };
    await tapSurface();
    await expect(ribbon).toHaveAttribute('data-tone', '1');
    await expect(ribbon).toHaveAttribute('data-running', 'true');
    const phase = () =>
      ribbon
        .locator('.ribbon-track')
        .evaluate((el) => el.style.getPropertyValue('--ring-phase'));
    const before = await phase();
    await page.clock.runFor(400);
    expect(await phase()).not.toBe(before);
    await tapSurface();
    await expect(ribbon).toHaveAttribute('data-tone', '2');
    for (let i = 0; i < 2; i++) {
      await page.clock.runFor(250);
      const faces = await ribbon
        .locator('.ribbon-group li')
        .evaluateAll((nodes) =>
          nodes.map((el) => ({
            facing: (el as HTMLElement).dataset.facing,
            opacity: getComputedStyle(el).opacity,
            hit: getComputedStyle(el).pointerEvents,
            area: (() => {
              const matrix = new DOMMatrix(getComputedStyle(el).transform);
              return matrix.a * matrix.d - matrix.b * matrix.c;
            })(),
          })),
        );
      expect(faces.some((face) => face.facing === 'front')).toBe(true);
      if (page.viewportSize()!.width <= 700) {
        for (const face of faces.filter((face) => face.facing === 'front'))
          expect(face.area).toBeGreaterThan(0);
      }
      for (const face of faces.filter((face) => face.facing === 'back')) {
        expect(face.opacity).toBe('0');
        expect(face.hit).toBe('none');
      }
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    // Keyboard users can bring any rear project to the front and open it.
    await viewport.focus();
    await page.keyboard.press('ArrowRight');
    const link = ribbon.locator('.ribbon-card').first();
    await link.focus();
    await expect(ribbon).toHaveAttribute('data-running', 'false');
    await link.tap();
    await expect(page).toHaveURL(
      route.startsWith('/en')
        ? /\/en\/projects\/oax-demo\/$/
        : /\/proyectos\/oax-demo\/$/,
    );
  }
  expect(errors).toEqual([]);
});

test('figura táctil: espacio propio, ensamblado, cambio de aspecto y pausa', async ({
  page,
}) => {
  const epoch = new Date('2026-10-11T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/');
  await page.clock.runFor(100);
  const handle = page.locator('.scene-handle');
  await expect(handle).toBeVisible();
  const anchor = await handle.boundingBox();
  const content = await page.locator('.intro > .tour-trigger').boundingBox();
  expect(anchor!.y).toBeGreaterThanOrEqual(content!.y + content!.height);
  expect(anchor!.x).toBeGreaterThanOrEqual(0);
  expect(anchor!.x + anchor!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  const canvas = page.locator('.ambient-canvas');
  await handle.scrollIntoViewIfNeeded();
  await page.clock.runFor(150);
  const initialAssembly = await canvas.getAttribute('data-assembly');
  const waiting = initialAssembly === 'waiting';
  await handle.tap();
  await page.clock.runFor(2200);
  // A sculpture initially below a short landscape viewport starts assembled;
  // only a visible initial sculpture has the waiting/assembly lifecycle.
  if (initialAssembly !== null)
    await expect(canvas).toHaveAttribute('data-assembly', 'complete');
  else await expect(canvas).not.toHaveAttribute('data-assembly', 'running');
  await expect(handle).toHaveAttribute(
    'aria-pressed',
    waiting ? 'false' : 'true',
  );
  await handle.tap();
  await expect(handle).toHaveAttribute(
    'aria-pressed',
    waiting ? 'true' : 'false',
  );
  await page.locator('.motion-toggle').tap();
  await expect(handle).toBeHidden();
  await expect(page.locator('.project-ribbon')).not.toHaveAttribute(
    'data-enhanced',
  );
  await page.locator('.motion-toggle').tap();
  await expect(handle).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(handle).toBeHidden();
  await expect(page.locator('.project-ribbon .ribbon-card')).toHaveCount(5);
});

test('detalles táctiles: nombre, circuitos al detener scroll y tecnologías; zoom y cierre', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.clock.runFor(1500);
  await page.locator('.name-spark').tap();
  await expect(page.locator('.discovery-constellation')).toHaveCount(1);
  const first = page.locator('.repository-link').first();
  await first.scrollIntoViewIfNeeded();
  await page.clock.runFor(1200);
  await expect(first.locator('.discovery-circuit')).toHaveCount(1);
  await first.tap();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
  await page.waitForLoadState('load');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on');
  await page.clock.runFor(1500);
  await page.locator('.tech-spark').first().tap();
  await expect(page.locator('.tech-signal')).toHaveCount(1);
  await page.locator('[data-image-open]').tap();
  const viewer = page.locator('.image-viewer');
  await expect(viewer).toBeVisible();
  await viewer.locator('[data-zoom-in]').tap();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('150%');
  const bounds = (await viewer.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(
    page.viewportSize()!.width + 1,
  );
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(
    page.viewportSize()!.height + 1,
  );
  await viewer.locator('.image-viewer-close').tap();
  await expect(viewer).not.toBeVisible();
});

test('recorridos con efectos: tarjeta contenida, avance, cierre y cinta activa', async ({
  page,
}) => {
  await page.clock.install();
  for (const route of [
    '/',
    '/proyectos/oax-demo/',
    '/proyectos/simulador-ferroviario/',
  ]) {
    await page.goto(route);
    await page.locator('[data-tour-start]').tap();
    await page.clock.runFor(1300);
    const tour = page.locator('.page-tour');
    for (let i = 0; i < 4; i++) {
      const box = (await tour.locator('.tour-card').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(
        page.viewportSize()!.width + 1,
      );
      expect(box.y + box.height).toBeLessThanOrEqual(
        page.viewportSize()!.height + 1,
      );
      expect(
        await tour.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await tour.locator('.tour-forward').tap();
      await page.clock.runFor(1300);
    }
    await tour.locator('.tour-close').tap();
    await page.locator('.project-ribbon').scrollIntoViewIfNeeded();
    await page.clock.runFor(600);
    await expect(page.locator('.project-ribbon')).toHaveAttribute(
      'data-running',
      'true',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('gestos reales: agarre sin scroll, inercia, scroll exterior y pellizco de galería', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'CDP supplies native swipes and multi-touch only in Chromium; WebKit uses native taps in the other cases.',
  );
  await page.addInitScript(() => {
    const samples = window as unknown as { sceneSamples: number[] };
    samples.sceneSamples = [];
    const post = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (
      message,
      transfer: Transferable[] | StructuredSerializeOptions = [],
    ) {
      if (message?.type === 'render')
        samples.sceneSamples.push(message.interaction.yaw);
      Reflect.apply(post, this, [message, transfer]);
    };
  });
  await page.goto('/');
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-renderer',
    'worker',
  );
  const session = await context.newCDPSession(page);
  const swipe = async (
    x: number,
    y: number,
    dx: number,
    dy: number,
    id: number,
  ) => {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id }],
    });
    for (let i = 1; i <= 5; i++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: x + (dx * i) / 5, y: y + (dy * i) / 5, id }],
      });
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  };
  const handle = page.locator('.scene-handle');
  const h = (await handle.boundingBox())!;
  const figureScroll = await page.evaluate(() => scrollY);
  await swipe(h.x + 40, h.y + h.height / 2, 110, 60, 1);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(figureScroll, 0);
  await swipe(h.x + 70, h.y + 35, 3, 85, 6);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(figureScroll, 0);
  await swipe(h.x + 40, h.y + h.height / 2, 110, 20, 7);
  const yaw = () =>
    page.evaluate(() =>
      (window as unknown as { sceneSamples: number[] }).sceneSamples.at(-1)!,
    );
  const released = await yaw();
  await expect.poll(yaw).toBeGreaterThan(released);
  // The address bar changing height must not cancel a horizontal fling.
  const beforeResize = await yaw();
  await page.setViewportSize({ width: 428, height: 846 });
  await expect.poll(yaw).toBeGreaterThan(beforeResize);
  await expect(handle).not.toHaveAttribute('data-dragging');
  await expect(handle).toHaveAttribute('aria-pressed', 'false');
  await handle.tap();
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  const v = (await ribbon.locator('.ribbon-viewport').boundingBox())!;
  const phase = () =>
    ribbon
      .locator('.ribbon-track')
      .evaluate((el) => el.style.getPropertyValue('--ring-phase'));
  const before = await phase();
  const ribbonScroll = await page.evaluate(() => scrollY);
  await swipe(v.x + v.width / 2, v.y + 10, -100, 65, 2);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(ribbonScroll, 0);
  expect(await phase()).not.toBe(before);
  await expect(page).toHaveURL(/\/$/);
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const scroll = await page.evaluate(() => scrollY);
  await swipe(v.x + v.width / 2, v.y + 10, 2, 110, 3);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scroll, 0);
  await swipe(8, v.y + 10, 2, 110, 8);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(scroll);
  await page.goto('/proyectos/oax-demo/');
  await page.locator('[data-image-open]').tap();
  const stage = page.locator('.image-viewport');
  const b = (await stage.boundingBox())!;
  const x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { x: x - 30, y, id: 4 },
      { x: x + 30, y, id: 5 },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { x: x - 80, y, id: 4 },
      { x: x + 80, y, id: 5 },
    ],
  });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect(stage).toHaveAttribute('data-zoomed', 'true');
  await page.locator('.image-viewer-close').tap();
  await expect(page.locator('.image-viewer')).not.toBeVisible();
});
