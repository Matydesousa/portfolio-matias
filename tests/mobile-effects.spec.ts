import { test, expect, type Page } from '@playwright/test';

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

test('sorpresa táctil: repetición rápida, luces visibles y sin scroll', async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(browserName !== 'chromium', 'Native touch swipes require CDP.');
  test.setTimeout(150_000);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.goto('/proyectos/oax-demo/');
  await page.evaluate(() => document.fonts.ready);
  const ribbon = page.locator('.project-ribbon');
  const viewport = ribbon.locator('.ribbon-viewport');
  await ribbon.scrollIntoViewIfNeeded();
  await page.clock.runFor(1000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const session = await context.newCDPSession(page);
  try {
    await expect(ribbon).not.toHaveAttribute('data-wake');
    for (let tone = 0; tone < 3; tone++) {
      const box = (await viewport.boundingBox())!;
      const y = box.y + 8;
      if (tone) await page.touchscreen.tap(box.x + box.width / 2, y);
      await expect(ribbon).toHaveAttribute('data-tone', String(tone));
      const scroll = await page.evaluate(() => scrollY);
      const start = box.x + box.width / 2 + 120;
      const touch = (x: number) => [{ x, y, id: 1 }];
      for (let grab = 0; grab < 4; grab++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: touch(start),
        });
        for (let step = 1; step <= 4; step++) {
          await page.clock.runFor(20);
          await session.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: touch(start - step * 60),
          });
        }
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
        if (grab < 2) await expect(ribbon).not.toHaveAttribute('data-wake');
      }
      await page.clock.runFor(300);
      await expect(ribbon).toHaveAttribute('data-wake');
      await expect(ribbon).toHaveAttribute('data-running', 'true');
      await expect(ribbon).toHaveAttribute('data-tone', String(tone));
      expect(await page.evaluate(() => scrollY)).toBe(scroll);
      expect(
        await ribbon
          .locator('.ribbon-wake')
          .evaluateAll((nodes) =>
            nodes.some((node) => Number(getComputedStyle(node).opacity) > 0.7),
          ),
      ).toBe(true);
      await ribbon.screenshot({
        path: testInfo.outputPath(`touch-surge-${tone}.png`),
      });
      await page.clock.runFor(8000);
      await expect(ribbon).not.toHaveAttribute('data-wake');
      await expect(ribbon).toHaveAttribute('data-running', 'true');
    }
    await page.locator('.motion-toggle').tap();
    await expect(ribbon.locator('.ribbon-wake').first()).toBeHidden();
    await expect(ribbon.getByRole('link')).toHaveCount(5);
    expect(errors).toEqual([]);
  } finally {
    await session.detach();
  }
});

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

test('figura móvil: canvas unido al espacio de agarre durante scroll, pausa y cambios de altura', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of routes) {
    await page.goto(route);
    const handle = page.locator('.scene-handle');
    await handle.scrollIntoViewIfNeeded();
    await expect(handle).toBeVisible();
    const alignment = () =>
      page.evaluate(() => {
        const canvas =
          document.querySelector<HTMLCanvasElement>('.ambient-canvas')!;
        const anchor = document.querySelector<HTMLElement>('.scene-anchor')!;
        const c = canvas.getBoundingClientRect(),
          a = anchor.getBoundingClientRect();
        return {
          local: canvas.parentElement === anchor,
          absolute: getComputedStyle(canvas).position === 'absolute',
          difference: Math.max(
            Math.abs(c.top - a.top),
            Math.abs(c.left - a.left),
            Math.abs(c.width - a.width),
            Math.abs(c.height - a.height),
          ),
          bitmapWidth: canvas.width,
          expectedWidth: Math.round(
            anchor.clientWidth * Math.min(devicePixelRatio, 1.5),
          ),
        };
      });
    for (const offset of [100, 220, 60, 0]) {
      await page.evaluate(
        (top) => scrollTo({ top, behavior: 'instant' }),
        offset,
      );
      await expect
        .poll(async () => (await alignment()).difference)
        .toBeLessThan(1);
      const layout = await alignment();
      expect(layout.local).toBe(true);
      expect(layout.absolute).toBe(true);
      expect(layout.bitmapWidth).toBe(layout.expectedWidth);
    }
    await page.locator('.motion-toggle').tap();
    await expect(handle).toBeHidden();
    await page.locator('.motion-toggle').tap();
    await expect(handle).toBeVisible();
    await expect
      .poll(async () => (await alignment()).difference)
      .toBeLessThan(1);
  }
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.width, height: size.height - 80 });
  const canvas = page.locator('.scene-anchor > .ambient-canvas');
  await expect(canvas).toBeAttached();
  expect(
    await canvas.evaluate((el) => (el as HTMLCanvasElement).width),
  ).toBeLessThan(size.width * 1.5);
  expect(errors).toEqual([]);
});

test('cinta táctil: arrastre continuo desde miniatura, título y tarjeta sin cancelación ni navegación', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Native multi-event touch supplied by CDP in Chromium.',
  );
  const session = await context.newCDPSession(page);
  for (const route of ['/', '/proyectos/oax-demo/']) {
    await page.goto(route);
    const ribbon = page.locator('.project-ribbon');
    await ribbon.scrollIntoViewIfNeeded();
    for (const selector of ['img', 'h3', 'a.ribbon-card']) {
      const point = await page.evaluate((selector) => {
        const box = document
          .querySelector('.ribbon-viewport')!
          .getBoundingClientRect();
        for (
          let y = box.top + 20;
          y < Math.min(innerHeight - 20, box.bottom - 20);
          y += 5
        )
          for (let x = innerWidth / 2 - 70; x < innerWidth / 2 + 60; x += 5) {
            const hit = document.elementFromPoint(x, y);
            if (hit?.matches(selector) && hit.closest('.ribbon-card'))
              return { x, y };
          }
        throw new Error('No visible touch target: ' + selector);
      }, selector);
      const phase = () =>
        ribbon
          .locator('.ribbon-track')
          .evaluate((el) => Number(el.style.getPropertyValue('--ring-phase')));
      const initialScroll = await page.evaluate(() => scrollY);
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ ...point, id: 1 }],
      });
      let previous = await phase();
      for (let i = 1; i <= 5; i++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: point.x + i * 12, y: point.y + i * 2, id: 1 }],
        });
        await expect(ribbon).toHaveAttribute('data-dragging', 'true');
        const current = await phase();
        expect(current).toBeGreaterThan(previous + 0.025);
        previous = current;
        await page.waitForTimeout(16);
      }
      // Release immediately after the last move. Browser assertions between
      // them would turn a fling into a stationary hold under test load.
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: point.x + 72, y: point.y + 12, id: 1 }],
      });
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect(ribbon).not.toHaveAttribute('data-dragging');
      await expect(ribbon).toHaveAttribute('data-running', 'true');
      await expect.poll(phase).toBeGreaterThan(previous);
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(initialScroll, 0);
      await expect(page).toHaveURL(new RegExp(route + '$'));
      await expect(ribbon).toHaveAttribute('data-tone', '0');
    }
  }
});

async function recordTapPulses(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as {
      tapPulses: number;
      copiedEmail: string;
    };
    state.tapPulses = 0;
    const original = Element.prototype.animate;
    Element.prototype.animate = function (
      ...args: Parameters<Element['animate']>
    ) {
      if (this.classList.contains('ambient-pulse')) state.tapPulses++;
      return original.apply(this, args);
    };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          state.copiedEmail = value;
        },
      },
    });
  });
}
const pulseCount = (page: Page) =>
  page.evaluate(() => (window as unknown as { tapPulses: number }).tapPulses);

test('toques: pulso de clic, doble toque, contacto y limpieza sin perder acciones', async ({
  page,
}) => {
  await recordTapPulses(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.goto('/');
  await page.clock.runFor(1500);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const point = { x: 8, y: Math.min(240, page.viewportSize()!.height - 30) };
  await expect(async () => {
    await page.clock.runFor(100);
    expect(await page.locator('.brand-signature').count()).toBe(1);
  }).toPass({ timeout: 5000 });
  expect(
    await page
      .locator('.ambient-pulse')
      .evaluate((el) => getComputedStyle(el).display),
  ).not.toBe('none');
  await page.touchscreen.tap(point.x, point.y);
  expect(await pulseCount(page)).toBe(1);
  await expect(page.locator('.discovery-constellation')).toHaveCount(0);
  await page.clock.runFor(160);
  await page.touchscreen.tap(point.x, point.y);
  expect(await pulseCount(page)).toBe(2);
  await expect(page.locator('.discovery-constellation')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.clock.runFor(700);
  const email = page.locator('[data-copy-email]');
  await email.scrollIntoViewIfNeeded();
  await page.clock.runFor(1000);
  const box = await email.boundingBox();
  await email.tap();
  await page.clock.runFor(50);
  await expect(email).toHaveAttribute('data-touch');
  await expect(email.locator('.contact-signal')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedEmail: string }).copiedEmail,
    ),
  ).toBe('matydesousa06@gmail.com');
  await expect(page.locator('.email-copy-status')).toContainText(
    'Correo copiado',
  );
  expect(await email.boundingBox()).toEqual(box);
  await page.clock.runFor(500);
  await expect(email).not.toHaveAttribute('data-touch');
  await page.locator('.motion-toggle').tap();
  await expect(page.locator('[data-touch]')).toHaveCount(0);
  await expect(
    page.locator('.contact-signal, .discovery-constellation'),
  ).toHaveCount(0);
  const paused = await pulseCount(page);
  await page.touchscreen.tap(point.x, point.y);
  expect(await pulseCount(page)).toBe(paused);
  expect(
    await page
      .locator('.ambient-pulse')
      .evaluate((el) => el.getAnimations().length),
  ).toBe(0);
  await page.locator('.motion-toggle').tap();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  const reduced = await pulseCount(page);
  await page.touchscreen.tap(point.x, point.y);
  expect(await pulseCount(page)).toBe(reduced);
  expect(errors).toEqual([]);
});

test('gestos nativos: arrastrar, sostener y pellizcar no disparan clics ni doble toque', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Native multi-touch requires CDP.');
  await recordTapPulses(page);
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.goto('/');
  await page.clock.runFor(1500);
  const session = await context.newCDPSession(page);
  const x = 8,
    y = 240;
  const touch = (x: number, y: number, id = 1) => ({ x, y, id });
  const send = (
    type: string,
    touchPoints: { x: number; y: number; id: number }[],
  ) =>
    session.send('Input.dispatchTouchEvent', {
      type: type as 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
      touchPoints,
    });
  try {
    await page.touchscreen.tap(x, y);
    const count = await pulseCount(page);
    await page.clock.runFor(150);
    await send('touchStart', [touch(x, y)]);
    await page.clock.runFor(40);
    await send('touchMove', [touch(x, y + 45)]);
    await page.clock.runFor(40);
    await send('touchMove', [touch(x, y)]);
    await send('touchEnd', []);
    expect(await pulseCount(page)).toBe(count);
    await expect(page.locator('.discovery-constellation')).toHaveCount(0);
    await page.clock.runFor(500);
    await send('touchStart', [touch(x, y)]);
    await page.clock.runFor(650);
    await send('touchEnd', []);
    expect(await pulseCount(page)).toBe(count);
    await expect(page.locator('.discovery-constellation')).toHaveCount(0);
    await page.clock.runFor(500);
    await send('touchStart', [touch(x, y)]);
    await send('touchCancel', []);
    await page.touchscreen.tap(x, y);
    await expect(page.locator('.discovery-constellation')).toHaveCount(0);
    const beforePinch = await pulseCount(page);
    const scale = await page.evaluate(() => visualViewport!.scale);
    await send('touchStart', [touch(130, 330, 2), touch(200, 330, 3)]);
    for (let step = 1; step <= 5; step++) {
      await page.clock.runFor(30);
      await send('touchMove', [
        touch(130 - step * 12, 330, 2),
        touch(200 + step * 12, 330, 3),
      ]);
    }
    await send('touchEnd', []);
    expect(await pulseCount(page)).toBe(beforePinch);
    await expect(page.locator('.discovery-constellation')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => visualViewport!.scale))
      .toBeGreaterThan(scale);
  } finally {
    await session.detach();
  }
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

async function expectLandscapeFrame(page: Page) {
  const geometry = await page.locator('.page-tour').evaluate((el) => {
    const dialog = el as HTMLElement;
    const card = dialog.querySelector<HTMLElement>('.tour-card')!;
    const spot = dialog.querySelector<HTMLElement>('.tour-spotlight')!;
    const next = dialog.querySelector<HTMLElement>('.tour-next')!;
    const copy = dialog.querySelector<HTMLElement>('.tour-copy')!;
    const root = document.querySelector<HTMLElement>(dialog.dataset.target!)!;
    const focus = dialog.dataset.focus
      ? root.querySelector<HTMLElement>(dialog.dataset.focus)!
      : root;
    const c = card.getBoundingClientRect(),
      s = spot.getBoundingClientRect(),
      n = next.getBoundingClientRect(),
      f = focus.getBoundingClientRect();
    const fits = (r: DOMRect) =>
      r.left >= -1 &&
      r.top >= -1 &&
      r.right <= innerWidth + 1 &&
      r.bottom <= innerHeight + 1;
    return {
      fits: fits(c) && fits(s) && fits(n),
      complete:
        s.left <= f.left + 1 &&
        s.top <= f.top + 1 &&
        s.right >= f.right - 1 &&
        s.bottom >= f.bottom - 1,
      separated: s.right + 16 <= c.left && c.bottom + 12 <= n.top + 1,
      positions: { card: c.toJSON(), spot: s.toJSON(), next: n.toJSON() },
      copyHeight: copy.clientHeight,
      horizontal:
        card.scrollWidth > card.clientWidth + 1 ||
        copy.scrollWidth > copy.clientWidth + 1,
      controls: [
        ...dialog.querySelectorAll<HTMLElement>(
          '.tour-close, .tour-play, .tour-previous, .tour-forward',
        ),
      ].every((button) => {
        const r = button.getBoundingClientRect();
        return fits(r) && r.top >= c.top && r.bottom <= c.bottom;
      }),
    };
  });
  expect(geometry.fits).toBe(true);
  expect(geometry.complete).toBe(true);
  expect(geometry.separated, JSON.stringify(geometry.positions)).toBe(true);
  expect(geometry.controls).toBe(true);
  expect(geometry.copyHeight).toBeGreaterThan(44);
  expect(geometry.horizontal).toBe(false);
}

test('recorridos horizontales: todas las paradas encuadradas, mensajes y controles visibles', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(
    browserName === 'webkit' && testInfo.project.name !== 'landscape-webkit',
    'Horizontal WebKit profile covers this layout.',
  );
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 832, height: 378 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const projects = routes.filter((route) => route.startsWith('/proyectos/'));
  for (const route of [
    '/',
    ...projects,
    '/en/',
    ...projects.map((route) => route.replace('/proyectos/', '/en/projects/')),
  ]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const original = await page
      .locator('.case-image .image-stage')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          width: (node as HTMLElement).offsetWidth,
          height: (node as HTMLElement).offsetHeight,
        })),
      );
    await page.locator('[data-tour-start]').tap();
    const tour = page.locator('.page-tour');
    await tour.locator('.tour-play').tap();
    await expect(tour).toHaveAttribute('data-layout', 'landscape');
    const stops = await tour.evaluate(
      (el) => JSON.parse((el as HTMLElement).dataset.stops!).length as number,
    );
    const initialNext = await tour.locator('.tour-next').boundingBox();
    for (let i = 0; i < stops; i++) {
      if (i)
        await tour
          .locator('.tour-forward')
          .evaluate((button) => (button as HTMLButtonElement).click());
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await expectLandscapeFrame(page);
      expect(await tour.locator('.tour-next').boundingBox()).toEqual(
        initialNext,
      );
    }
    await tour.locator('.tour-close').tap();
    await expect(tour).not.toBeVisible();
    await expect(
      page.locator(
        '.tour-focus-landscape, .tour-focus-image, .tour-focus-window, .tour-scroll-space',
      ),
    ).toHaveCount(0);
    expect(
      await page.locator('.case-image .image-stage').evaluateAll((nodes) =>
        nodes.map((node) => ({
          width: (node as HTMLElement).offsetWidth,
          height: (node as HTMLElement).offsetHeight,
        })),
      ),
    ).toEqual(original);
  }
  expect(errors).toEqual([]);
});

test('recorrido horizontal animado: rotación y altura variable sin recortes ni errores', async ({
  page,
  browserName,
}, testInfo) => {
  test.skip(
    browserName === 'webkit' && testInfo.project.name !== 'landscape-webkit',
    'Horizontal WebKit profile covers rotation.',
  );
  await page.clock.install();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/proyectos/oax-demo/']) {
    await page.setViewportSize({ width: 428, height: 926 });
    await page.goto(route);
    await page.locator('[data-tour-start]').tap();
    const tour = page.locator('.page-tour');
    await tour.locator('.tour-play').tap();
    await page.clock.runFor(1000);
    for (let i = 0; i < (route === '/' ? 1 : 6); i++) {
      await tour
        .locator('.tour-forward')
        .evaluate((button) => (button as HTMLButtonElement).click());
      await page.clock.runFor(1000);
    }
    const target = await tour.getAttribute('data-target');
    for (const viewport of [
      { width: 832, height: 378 },
      { width: 926, height: 320 },
      { width: 568, height: 320 },
    ]) {
      if (route === '/') await tour.locator('.tour-follow').focus();
      await page.setViewportSize(viewport);
      // Native resize events can arrive after the viewport promise in WebKit.
      // Advance animation time as the browser delivers the layout callbacks.
      await expect(async () => {
        await page.clock.runFor(100);
        await expect(tour).toHaveAttribute('data-layout', 'landscape');
        await expect(tour).toHaveAttribute('data-playing', 'false');
        await expect(tour).toHaveAttribute('data-target', target!);
        await expectLandscapeFrame(page);
        if (route === '/')
          await expect(tour.locator('.tour-follow')).toBeFocused();
      }).toPass({ timeout: 5000, intervals: [50, 100, 250] });
    }
    await page.setViewportSize({ width: 428, height: 926 });
    await expect(async () => {
      await page.clock.runFor(100);
      await expect(tour).toHaveAttribute('data-layout', 'default');
      await expect(page.locator('.tour-focus-landscape')).toHaveCount(0);
    }).toPass({ timeout: 5000 });
    await tour.locator('.tour-close').tap();
    await expect(page.locator('.tour-scroll-space')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
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
