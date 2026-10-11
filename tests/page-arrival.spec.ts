import { test, expect } from '@playwright/test';
import { createSculpture } from '../src/scripts/scene';

test('sin gestos se arma después de cinco segundos y el ensamblado dura más de un segundo', async ({
  page,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const canvas = page.locator('.ambient-canvas');
  await page.clock.runFor(4900);
  await page.mouse.move(1200, 300);
  await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
  await page.clock.runFor(150);
  await expect(canvas).toHaveAttribute('data-assembly', 'running');
  await page.clock.runFor(1000);
  await expect(canvas).toHaveAttribute('data-assembly', 'running');
  await page.clock.runFor(900);
  await expect(canvas).toHaveAttribute('data-assembly', 'complete');
  await expect(page.locator('.scene-handle')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.locator('.scene-handle').click();
  await expect(page.locator('.scene-handle')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('las piezas se separan sin puentes largos y recuperan exactamente la malla original', () => {
  const render = createSculpture();
  const geometry = (assembly?: number, time = 0, pointerX = 0) => {
    const triangles: number[][] = [];
    let path: number[] = [];
    const ctx = {
      save() {},
      restore() {},
      fillRect() {},
      fill() {},
      stroke() {},
      ellipse() {},
      arc() {},
      createRadialGradient() {
        return { addColorStop() {} };
      },
      beginPath() {
        path = [];
      },
      moveTo(x: number, y: number) {
        path.push(x, y);
      },
      lineTo(x: number, y: number) {
        path.push(x, y);
      },
      closePath() {
        triangles.push(path);
      },
    } as unknown as CanvasRenderingContext2D;
    render(ctx, time, 250, 250, 100, pointerX, 0, 0.32, {
      yaw: 0,
      pitch: 0,
      rotationTime: 0,
      wireframe: false,
      assembly,
    });
    return triangles;
  };
  const original = geometry();
  expect(geometry(1)).toEqual(original);
  const separated = geometry(0);
  expect(separated.length).toBeGreaterThan(400);
  const edge = (triangles: number[][]) =>
    Math.max(
      ...triangles.flatMap((t) => [
        Math.hypot(t[0] - t[2], t[1] - t[3]),
        Math.hypot(t[2] - t[4], t[3] - t[5]),
        Math.hypot(t[4] - t[0], t[5] - t[1]),
      ]),
    );
  // Local caps give fragments volume; no face bridges distant orbiting pieces.
  expect(edge(separated)).toBeLessThan(60);
  expect(geometry(0, 5)).not.toEqual(separated);
  expect(geometry(0, 0, 1)).not.toEqual(separated);
  const width = (triangles: number[][]) => {
    const xs = triangles.flatMap((t) => [t[0], t[2], t[4]]);
    return Math.max(...xs) - Math.min(...xs);
  };
  expect(width(separated)).toBeGreaterThan(width(original) + 30);
  // Nearly assembled pieces converge; the exact final geometry is checked above.
  expect(Math.abs(width(geometry(0.95)) - width(original))).toBeLessThan(
    width(original) * 0.005,
  );
});

test('nube en espera y entrada no bloqueante en portada, cinco proyectos y 404 de ambos idiomas', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const slugs = [
    'oax-demo',
    'notas-pendientes',
    'simulador-ferroviario',
    'simulador-bancario',
    'gestion-hotel',
  ];
  for (const locale of ['es', 'en']) {
    for (const slug of ['', ...slugs, '404']) {
      const path =
        slug === '404'
          ? locale === 'en'
            ? '/en/404/'
            : '/404.html'
          : slug
            ? `${locale === 'en' ? '/en/projects' : '/proyectos'}/${slug}/`
            : locale === 'en'
              ? '/en/'
              : '/';
      await page.goto(path);
      await expect(page.locator('main h1')).toBeVisible();
      const canvas = page.locator('.ambient-canvas');
      if (slug !== '404')
        await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
      await page.clock.runFor(2500);
      await page.mouse.move(1200, 400);
      if (slug !== '404') {
        await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
        await page.mouse.wheel(0, -1);
        await expect(canvas).toHaveAttribute('data-assembly', 'running');
        await page.clock.runFor(2000);
      }
      if (slug !== '404')
        await expect(canvas).toHaveAttribute('data-assembly', 'complete');
      expect(
        await page.evaluate(
          () =>
            document.getAnimations().filter((a) => a.id === 'page-arrival')
              .length,
        ),
      ).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(1440);
    }
  }
  expect(errors).toEqual([]);
});

test('el teclado o un toque adelantan el ensamblado automático', async ({
  page,
  browser,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/');
  await page.clock.runFor(4000);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'waiting',
  );
  await page.keyboard.press('Tab');
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'running',
  );
  await page.clock.runFor(2000);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'complete',
  );

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const phone = await mobile.newPage();
    await phone.clock.install({ time: epoch });
    await phone.clock.pauseAt(epoch);
    await phone.goto('http://127.0.0.1:4321/');
    await phone.clock.runFor(2000);
    await expect(phone.locator('.ambient-canvas')).toHaveAttribute(
      'data-assembly',
      'waiting',
    );
    await phone.touchscreen.tap(350, 360);
    await expect(phone.locator('.ambient-canvas')).toHaveAttribute(
      'data-assembly',
      'running',
    );
    await phone.clock.runFor(2000);
    await expect(phone.locator('.ambient-canvas')).toHaveAttribute(
      'data-assembly',
      'complete',
    );
    expect(
      await phone.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  } finally {
    await mobile.close();
  }
});

test('ocultar la pestaña o redimensionarla conserva la nube pendiente', async ({
  page,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  // Emulate visibility transitions deterministically; motion must suspend its RAF.
  await page.addInitScript(() =>
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    }),
  );
  await page.goto('/');
  const canvas = page.locator('.ambient-canvas');
  await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
  await page.clock.fastForward(5000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.runFor(160);
  await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
  expect(
    await canvas.evaluate((element: HTMLCanvasElement) =>
      element
        .getContext('2d')!
        .getImageData(0, 0, element.width, element.height)
        .data.some((channel) => channel > 0),
    ),
  ).toBe(true);
  await page.clock.runFor(4700);
  await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      value: true,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.fastForward(6000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      value: false,
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(100);
  await expect(canvas).toHaveAttribute('data-assembly', 'waiting');
  await page.clock.runFor(100);
  await expect(canvas).toHaveAttribute('data-assembly', 'running');
  await page.clock.runFor(2000);
  await expect(canvas).toHaveAttribute('data-assembly', 'complete');
});

test('piezas más transparentes y dos luces orbitales visibles antes y después del ensamblado', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const modulePath = '/src/scripts/scene.ts';
    const { createSculpture } = await import(modulePath);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    const render = createSculpture();
    const arc = ctx.arc.bind(ctx),
      closePath = ctx.closePath.bind(ctx);
    let orbits: number[] = [],
      surfaces: number[] = [];
    ctx.arc = (...args) => {
      orbits.push(ctx.globalAlpha);
      arc(...args);
    };
    ctx.closePath = () => {
      surfaces.push(ctx.globalAlpha);
      closePath();
    };
    const sample = (assembly: number) => {
      orbits = [];
      surfaces = [];
      render(ctx, 0, 300, 300, 100, 0, 0, 0.32, {
        yaw: 0,
        pitch: 0,
        rotationTime: 0,
        wireframe: false,
        assembly,
      });
      return { orbits, surfaceOpacity: Math.max(...surfaces) };
    };
    return { separated: sample(0), assembled: sample(1) };
  });
  expect(result.separated.orbits).toHaveLength(2);
  expect(result.separated.orbits).toEqual(result.assembled.orbits);
  expect(result.separated.orbits.every((alpha: number) => alpha > 0)).toBe(
    true,
  );
  expect(result.separated.surfaceOpacity).toBeLessThan(
    result.assembled.surfaceOpacity * 0.8,
  );
  expect(result.separated.surfaceOpacity).toBeGreaterThan(0);
});

test('el gesto inicial de teclado o clic prolongado solo arma; tras un scroll el clic cambia el aspecto', async ({
  page,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const gesture of ['keyboard', 'held-click', 'scroll']) {
    await page.goto('/');
    await page.clock.runFor(80);
    const handle = page.locator('.scene-handle');
    if (gesture === 'keyboard') {
      await handle.focus();
      await handle.press('Space');
    } else if (gesture === 'held-click') {
      const bounds = (await handle.boundingBox())!;
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      await page.mouse.down();
      await page.clock.runFor(2000);
      await page.mouse.up();
    } else await page.mouse.wheel(0, -1);
    await page.clock.runFor(2000);
    await expect(handle).toHaveAttribute('aria-pressed', 'false');
    await handle.click();
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
  }
});

test('clic y scroll ensamblan suavemente; pausa y movimiento reducido conservan navegación', async ({
  page,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.clock.runFor(80);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'waiting',
  );
  await page.locator('.scene-handle').click();
  await expect(page.locator('.scene-handle')).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'running',
  );
  await page.clock.runFor(2000);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'complete',
  );
  await page.locator('.scene-handle').click();
  await expect(page.locator('.scene-handle')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('.motion-toggle').click();
  await page.locator('.motion-toggle').click();
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'complete',
  );
  await page.clock.runFor(1600);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/proyectos/notas-pendientes/');
  await page.clock.runFor(80);
  await page.evaluate(() => scrollTo({ top: 120, behavior: 'instant' }));
  await page.clock.runFor(50);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'running',
  );
  await page.clock.runFor(2000);
  await expect(page.locator('.ambient-canvas')).toHaveAttribute(
    'data-assembly',
    'complete',
  );
  await expect(page.locator('.scene-handle')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  await expect(page.locator('.ambient-canvas')).not.toHaveAttribute(
    'data-assembly',
  );
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.id === 'page-arrival').length,
    ),
  ).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => localStorage.setItem('portfolio-motion', 'off'));
  await page.goto('/en/projects/oax-demo/');
  await expect(page.locator('.ambient-canvas')).not.toHaveAttribute(
    'data-assembly',
  );
  await expect(page.locator('.ambient-canvas')).toBeHidden();
  await expect(page.locator('h1')).toBeVisible();
});
