import { test, expect } from '@playwright/test';
import { RibbonPhysics } from '../src/scripts/ribbon-physics';
import { getProjects } from '../src/i18n/content';

test('la cinta gira durante el recorrido y después de cerrar su última parada', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.clock.install();
  for (const path of [
    '/',
    ...getProjects('es').map((project) => `/proyectos/${project.slug}/`),
    '/en/projects/oax-demo/',
  ]) {
    await page.goto(path);
    await page.clock.runFor(1500);
    await page.locator('[data-tour-start]').click();
    const tour = page.locator('.page-tour');
    await page.clock.runFor(1000);
    await tour.locator('.tour-play').click();
    // Advance rapidly to the last stop, then let its camera finish normally.
    await tour.evaluate((el) => {
      const stops = JSON.parse((el as HTMLElement).dataset.stops!).length;
      const forward = el.querySelector<HTMLButtonElement>('.tour-forward')!;
      for (let stop = 1; stop < stops; stop++) forward.click();
    });
    await page.clock.runFor(1000);
    const ribbon = page.locator('.project-ribbon');
    const phase = () =>
      ribbon
        .locator('.ribbon-track')
        .evaluate((el) =>
          Number((el as HTMLElement).style.getPropertyValue('--ring-phase')),
        );
    await expect(ribbon).toHaveAttribute('data-running', 'true');
    const during = await phase();
    await page.clock.runFor(700);
    expect(await phase()).not.toBe(during);
    // Pausing the guide must only stop the guide's advance, not the ribbon.
    await expect(tour).toHaveAttribute('data-playing', 'false');
    await page.keyboard.press('Escape');
    await expect(tour).toBeHidden();
    await expect(ribbon).toHaveAttribute('data-running', 'true');
    const after = await phase();
    await page.clock.runFor(700);
    expect(await phase()).not.toBe(after);
  }
});

test('recorrido y visor conservan pausas explícitas y navegación estable por teclado', async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/proyectos/oax-demo/');
  await page.clock.runFor(1500);
  const ribbon = page.locator('.project-ribbon');
  const phase = () =>
    ribbon
      .locator('.ribbon-track')
      .evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue('--ring-phase'),
      );
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  await page
    .locator('.image-expand')
    .evaluate((el) => (el as HTMLElement).click());
  await expect(page.locator('.image-viewer')).toBeVisible();
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  const frozen = await phase();
  await page.clock.runFor(700);
  expect(await phase()).toBe(frozen);
  await page.keyboard.press('Escape');
  await expect(page.locator('.image-viewer')).toBeHidden();
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  await ribbon.getByRole('link').first().focus();
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  await page.clock.runFor(700);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
  await page
    .getByRole('button', { name: 'Pausar efectos', exact: true })
    .click();
  await page.locator('[data-tour-start]').click();
  await expect(ribbon).not.toHaveAttribute('data-enhanced');
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  await page.keyboard.press('Escape');
  await expect(page.locator('.page-tour')).toBeHidden();
  await expect(ribbon).not.toHaveAttribute('data-enhanced');
});

test('soltar fuera antes de capturar el puntero no deja la cinta detenida', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const viewport = ribbon.locator('.ribbon-viewport');
  const box = (await viewport.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 8);
  await page.mouse.down();
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  await page.mouse.move(8, 8);
  await page.mouse.up();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const phase = () =>
    ribbon
      .locator('.ribbon-track')
      .evaluate((el) =>
        (el as HTMLElement).style.getPropertyValue('--ring-phase'),
      );
  const before = await phase();
  await page.clock.runFor(700);
  expect(await phase()).not.toBe(before);
});

test('pausar reemplaza la cinta por enlaces planos y reactivar recupera el óvalo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-enhanced');
  // The static list must also ignore the white ribbon palette.
  await ribbon.locator('.ribbon-viewport').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await expect(ribbon).toHaveAttribute('data-tone', '2');
  await page
    .getByRole('button', { name: 'Pausar efectos', exact: true })
    .click();
  await expect(ribbon).not.toHaveAttribute('data-enhanced');
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon.locator('.ribbon-surface')).toBeHidden();
  await expect(ribbon.locator('.ribbon-card-top').first()).toBeHidden();
  await expect(ribbon.getByRole('link')).toHaveCount(5);
  const flat = await ribbon.evaluate((el) => {
    const viewport = el.querySelector('.ribbon-viewport')!;
    const card = el.querySelector('.ribbon-card')!;
    return {
      perspective: getComputedStyle(viewport).perspective,
      track: getComputedStyle(el.querySelector('.ribbon-track')!).transform,
      slots: [...el.querySelectorAll('.ribbon-group li')].map(
        (slot) => getComputedStyle(slot).transform,
      ),
      background: getComputedStyle(card).backgroundImage,
      shadow: getComputedStyle(card).boxShadow,
      help: viewport.getAttribute('aria-describedby'),
      instructionsHidden: [
        ...el.querySelectorAll<HTMLElement>('#ribbon-help, #ribbon-keyboard'),
      ].every((help) => help.hidden),
    };
  });
  expect(flat).toEqual({
    perspective: 'none',
    track: 'none',
    slots: Array(5).fill('none'),
    background: 'none',
    shadow: 'none',
    help: null,
    instructionsHidden: true,
  });
  const tone = await ribbon.getAttribute('data-tone');
  await ribbon.locator('.ribbon-viewport').focus();
  await page.keyboard.press('Space');
  await expect(ribbon).toHaveAttribute('data-tone', tone!);
  await ribbon.getByRole('link').first().click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
  await expect(page.locator('.project-ribbon')).not.toHaveAttribute(
    'data-enhanced',
  );
  await page
    .getByRole('button', { name: 'Activar efectos', exact: true })
    .click();
  const restored = page.locator('.project-ribbon');
  await restored.scrollIntoViewIfNeeded();
  await expect(restored).toHaveAttribute('data-enhanced');
  await expect(restored.locator('.ribbon-segment').first()).toBeVisible();
  await expect(restored).toHaveAttribute('data-running', 'true');
  expect(
    await restored
      .locator('.ribbon-viewport')
      .evaluate((el) => getComputedStyle(el).perspective),
  ).not.toBe('none');
});

test('movimiento reducido usa enlaces planos y conserva el foco al cambiar de modo', async ({
  page,
}) => {
  await page.goto('/en/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  const link = ribbon.getByRole('link').last();
  await link.focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(ribbon).not.toHaveAttribute('data-enhanced');
  await expect(link).toBeFocused();
  await expect(ribbon.locator('.ribbon-surface')).toBeHidden();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(ribbon).toHaveAttribute('data-enhanced');
  await expect(link).toBeFocused();
  await expect(link).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/projects\/gestion-hotel\/$/);
});

test('cinta compartida en todas las vistas y sin navegación inferior antigua', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const locale of ['es', 'en'] as const) {
    const paths = [
      locale === 'en' ? '/en/' : '/',
      locale === 'en' ? '/en/404/' : '/404.html',
      ...getProjects(locale).map(
        (project) =>
          `${locale === 'en' ? '/en/projects' : '/proyectos'}/${project.slug}/`,
      ),
    ];
    for (const path of paths) {
      await page.goto(path);
      const ribbon = page.locator('.project-ribbon');
      await expect(ribbon).toHaveCount(1);
      await expect(ribbon.getByRole('link')).toHaveCount(5);
      await expect(page.locator('.case-next')).toHaveCount(0);
      const links = await ribbon
        .locator('.ribbon-card')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      expect(links).toEqual(
        getProjects(locale).map(
          (project) =>
            `${locale === 'en' ? '/en/projects' : '/proyectos'}/${project.slug}/`,
        ),
      );
      expect(
        await page.evaluate(() =>
          Boolean(
            document
              .querySelector('.project-ribbon')!
              .compareDocumentPosition(
                document.querySelector('.site-footer')!,
              ) & Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        ),
      ).toBe(true);
    }
  }
});

test('cursor global sutil, giro sin freno al hover y color sin perder enlaces', async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const track = ribbon.locator('.ribbon-track');
  await page.mouse.move(8, 8);
  await page.clock.runFor(500);
  const left = await track.evaluate((el) => el.style.transform);
  await page.mouse.move(1432, 8);
  await page.clock.runFor(500);
  expect(await track.evaluate((el) => el.style.transform)).not.toBe(left);
  expect(
    await track.evaluate((el) =>
      Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41),
    ),
  ).toBeLessThanOrEqual(7);
  const viewport = ribbon.locator('.ribbon-viewport');
  const bounds = (await viewport.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + 8);
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const phase = await track.evaluate(
    (el) => +el.style.getPropertyValue('--ring-phase'),
  );
  await page.clock.runFor(500);
  expect(
    await track.evaluate((el) => +el.style.getPropertyValue('--ring-phase')),
  ).toBeLessThan(phase);
  const background = await ribbon
    .locator('.ribbon-card')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  await viewport.click({ position: { x: bounds.width / 2, y: 8 } });
  await expect(ribbon).toHaveAttribute('data-tone', '1');
  const sky = await ribbon.evaluate((el) =>
    getComputedStyle(el)
      .getPropertyValue('--ribbon-rgb')
      .trim()
      .split(/\s+/)
      .map(Number),
  );
  expect(sky[1]).toBeGreaterThan(sky[0] * 1.3);
  expect(sky[2]).toBeGreaterThan(sky[1]);
  expect(
    await ribbon
      .locator('.ribbon-card')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundImage),
  ).not.toBe(background);
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  await expect(page).toHaveURL(/\/$/);
  await viewport.focus();
  await page.keyboard.press('Enter');
  await expect(ribbon).toHaveAttribute('data-tone', '2');
  const wireframe = await ribbon.evaluate((el) => {
    const card = getComputedStyle(el.querySelector('.ribbon-card')!);
    const band = getComputedStyle(el.querySelector('.ribbon-segment')!);
    return {
      card: card.backgroundImage,
      band: band.backgroundImage,
      fill: card.backgroundColor,
      edge: card.borderTopColor,
    };
  });
  expect(wireframe.card).toBe('none');
  expect(wireframe.band).toBe('none');
  expect(wireframe.fill).toBe('rgba(0, 0, 0, 0)');
  expect(wireframe.edge).toMatch(/^rgba?\(255, 255, 255/);
  await page.keyboard.press('Space');
  await expect(ribbon).toHaveAttribute('data-tone', '0');
  await expect(ribbon.getByRole('link')).toHaveCount(5);
});

test('inclinación vertical limitada, retorno suave y teclado sin voltear la cinta', async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await page.clock.runFor(800);
  const viewport = ribbon.locator('.ribbon-viewport');
  const track = ribbon.locator('.ribbon-track');
  const pitch = () =>
    track.evaluate((el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return (Math.atan2(m.m23, m.m22) * 180) / Math.PI;
    });
  const b = (await viewport.boundingBox())!;
  const x = b.x + b.width / 2,
    y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.clock.runFor(800);
  const normal = await pitch();
  await page.mouse.down();
  // Autoplay stops on pointerdown; compare from the actual start of the grab.
  const phase = await track.evaluate((el) =>
    el.style.getPropertyValue('--ring-phase'),
  );
  await page.mouse.move(x, y + 200, { steps: 4 });
  await expect(ribbon).toHaveAttribute('data-dragging', 'true');
  expect(await pitch()).toBeCloseTo(normal + 2.2, 2);
  expect(
    await track.evaluate((el) => el.style.getPropertyValue('--ring-phase')),
  ).toBe(phase);
  await page.mouse.move(x, y - 120, { steps: 4 });
  expect(await pitch()).toBeCloseTo(normal - 2.2, 2);
  await page.mouse.up();
  await expect(ribbon).toHaveAttribute('data-tone', '0');
  await expect(page).toHaveURL(/\/$/);
  await page.clock.runFor(1600);
  expect(await pitch()).toBeCloseTo(normal, 1);
  await viewport.focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowDown');
  expect(await pitch()).toBeCloseTo(-7.8, 2);
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowUp');
  expect(await pitch()).toBeCloseTo(-12.2, 2);
  await page
    .getByRole('button', { name: 'Pausar efectos', exact: true })
    .click();
  await expect(ribbon).not.toHaveAttribute('data-enhanced');
  expect(await track.evaluate((el) => getComputedStyle(el).transform)).toBe(
    'none',
  );
});

test('física horizontal: impulso, fricción independiente del frame y frenado al sostener', () => {
  const fast = new RibbonPhysics(),
    slow = new RibbonPhysics();
  fast.drag(100, 0.05);
  slow.drag(100, 0.05);
  expect(fast.velocity + fast.baseSpeed).toBeGreaterThan(1000);
  expect(fast.velocity + fast.baseSpeed).toBeLessThanOrEqual(1800);
  for (let i = 0; i < 60; i++) fast.step(1 / 60);
  for (let i = 0; i < 30; i++) slow.step(1 / 30);
  expect(fast.position).toBeCloseTo(slow.position, 6);
  expect(fast.velocity).toBeCloseTo(slow.velocity, 6);
  fast.step(4);
  expect(fast.velocity).toBe(0);
  fast.drag(-30, 0.02);
  expect(fast.velocity + fast.baseSpeed).toBeLessThan(0);
  fast.release(0.2);
  expect(fast.velocity).toBe(0);
});

for (const locale of ['es', 'en'] as const) {
  test(`cinta: enlaces reales, foco, teclado, móvil y texto ampliado (${locale})`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(locale === 'en' ? '/en/' : '/');
      if (width === 390)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      const ribbon = page.locator('.project-ribbon');
      await ribbon.scrollIntoViewIfNeeded();
      const viewport = ribbon.locator('.ribbon-viewport');
      const links = ribbon.locator('.ribbon-group:not([aria-hidden]) a');
      await expect(links).toHaveCount(5);
      await expect(ribbon.getByRole('link')).toHaveCount(5);
      await expect(ribbon.getByRole('button')).toHaveCount(0);
      await expect(ribbon.locator('.ribbon-heading')).toHaveCount(0);
      for (let i = 0; i < 5; i++) {
        await links.nth(i).focus();
        const b = await links.nth(i).boundingBox(),
          v = await viewport.boundingBox();
        expect(b!.x).toBeGreaterThanOrEqual(v!.x - 1);
        expect(b!.x + b!.width).toBeLessThanOrEqual(v!.x + v!.width + 1);
        expect(b!.y).toBeGreaterThanOrEqual(v!.y - 1);
        expect(b!.y + b!.height).toBeLessThanOrEqual(v!.y + v!.height + 1);
        await expect(links.nth(i)).toHaveAttribute(
          'href',
          `${locale === 'en' ? '/en/projects' : '/proyectos'}/${getProjects(locale)[i].slug}/`,
        );
      }
      await page.keyboard.press('ArrowRight');
      await expect(links.last()).toBeFocused();
      await links.first().focus();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      expect(await viewport.evaluate((el) => el.scrollLeft)).toBe(0);
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/oax-demo\/$/);
    }
    expect(errors).toEqual([]);
  });
}

test('movimiento continuo, arrastre/inercia sin clic accidental y pausas', async ({
  page,
}) => {
  await page.clock.install();
  await page.goto('/');
  const ribbon = page.locator('.project-ribbon');
  const track = ribbon.locator('.ribbon-track');
  const transform = () =>
    track.evaluate((el) => el.style.getPropertyValue('--ring-phase'));
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const before = await transform();
  await page.clock.runFor(1000);
  expect(await transform()).not.toBe(before);
  const viewport = ribbon.locator('.ribbon-viewport');
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const held = await transform();
  await page.mouse.down();
  await page.mouse.move(x + 130, y, { steps: 5 });
  const dragged = await transform();
  expect(dragged).not.toBe(held);
  await page.mouse.up();
  await page.clock.runFor(150);
  expect(await transform()).not.toBe(dragged);
  await expect(page).toHaveURL(/\/$/);
  // Holding still brakes the momentum rather than reusing the last flick.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 80, y);
  await page.clock.runFor(200);
  await page.mouse.up();
  await expect(ribbon).toHaveAttribute('data-running', 'true');
  const stopped = await transform();
  await page.clock.runFor(500);
  expect(Number(await transform())).toBeLessThan(Number(stopped));
  await viewport.focus();
  await page.keyboard.press('Space');
  await expect(ribbon).toHaveAttribute('data-tone', '1');
  const focused = await transform();
  await page.clock.runFor(500);
  expect(await transform()).toBe(focused);
  // Keyboard stays stable, but deliberately moving to another card is available.
  await page.keyboard.press('ArrowRight');
  expect(await transform()).not.toBe(focused);
  await page
    .getByRole('button', { name: 'Pausar efectos', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(ribbon).toHaveAttribute('data-running', 'false');
  const first = ribbon.locator('.ribbon-group:not([aria-hidden]) a').first();
  await first.focus();
  await first.click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
});

test('óvalo 3D: geometría sin deformar tarjetas y superficie continua para agarrar', async ({
  page,
}) => {
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon).toHaveAttribute('data-enhanced');
  await expect(ribbon.locator('.ribbon-segment')).toHaveCount(48);
  // Focus reveals the entire container and freezes autoplay for geometry checks.
  await ribbon.locator('.ribbon-viewport').focus();
  await page.clock.runFor(80);
  const geometry = await ribbon.evaluate((el) => {
    const track = el.querySelector<HTMLElement>('.ribbon-track')!;
    const viewport = el.querySelector<HTMLElement>('.ribbon-viewport')!;
    const positions = [
      ...el.querySelectorAll<HTMLElement>('.ribbon-group li'),
    ].map((slot) => {
      const m = new DOMMatrix(getComputedStyle(slot).transform);
      return {
        x: m.m41,
        z: m.m43,
        width: slot.offsetWidth,
        backface: getComputedStyle(slot).backfaceVisibility,
      };
    });
    return {
      perspective: parseFloat(getComputedStyle(viewport).perspective),
      preserve: getComputedStyle(track).transformStyle,
      transform: track.style.transform,
      phase: track.style.getPropertyValue('--ring-phase'),
      radiusX: parseFloat(el.style.getPropertyValue('--ring-radius-x')),
      radiusZ: parseFloat(el.style.getPropertyValue('--ring-radius-z')),
      positions,
      visibleWidth: (() => {
        const rectangles = [...el.querySelectorAll('.ribbon-segment')].map(
          (segment) => segment.getBoundingClientRect(),
        );
        return (
          Math.max(...rectangles.map((r) => r.right)) -
          Math.min(...rectangles.map((r) => r.left))
        );
      })(),
      viewportWidth: viewport.clientWidth,
    };
  });
  expect(geometry.perspective).toBeGreaterThanOrEqual(900);
  expect(geometry.preserve).toBe('preserve-3d');
  expect(geometry.transform).toContain('rotateY');
  expect(geometry.radiusX / geometry.radiusZ).toBeGreaterThan(2);
  expect(geometry.visibleWidth).toBeGreaterThan(geometry.viewportWidth * 0.8);
  for (const position of geometry.positions) {
    expect(
      (position.x / geometry.radiusX) ** 2 +
        (position.z / geometry.radiusZ) ** 2,
    ).toBeCloseTo(1, 4);
    expect(position.backface).toBe('hidden');
  }
  expect(new Set(geometry.positions.map((p) => Math.round(p.z))).size).toBe(3);
  expect(
    2 * geometry.radiusX * Math.tan(Math.PI / 5) - geometry.positions[0].width,
  ).toBeGreaterThan(100);
  await expect(ribbon.locator('.ribbon-segment').first()).toBeVisible();
  expect(
    await ribbon
      .locator('.ribbon-surface')
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe('none');
  // Grab the empty part above the front card, not a project link.
  const viewport = ribbon.locator('.ribbon-viewport');
  const b = (await viewport.boundingBox())!;
  const before = geometry.phase;
  await page.mouse.move(b.x + b.width / 2, b.y + 12);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2 + 90, b.y + 12, { steps: 5 });
  await page.mouse.up();
  expect(
    await ribbon
      .locator('.ribbon-track')
      .evaluate((el) => el.style.getPropertyValue('--ring-phase')),
  ).not.toBe(before);
  await expect(page).toHaveURL(/\/$/);
});

test('sin JavaScript: listado plano sin desbordamiento y enlaces nativos', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  await expect(ribbon.getByRole('button')).toHaveCount(0);
  await expect(ribbon.getByRole('link')).toHaveCount(5);
  const viewport = ribbon.locator('.ribbon-viewport');
  expect(await viewport.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    false,
  );
  await ribbon.getByRole('link').last().click();
  await expect(page).toHaveURL(/\/en\/projects\/gestion-hotel\/$/);
  await context.close();
});

test('gestos reales en móvil: arrastre horizontal y desplazamiento vertical conservado', async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  const ribbon = page.locator('.project-ribbon');
  await ribbon.scrollIntoViewIfNeeded();
  const viewport = ribbon.locator('.ribbon-viewport');
  const bounds = (await viewport.boundingBox())!;
  const x = bounds.x + bounds.width / 2,
    y = bounds.y + bounds.height / 2;
  const touch = await context.newCDPSession(page);
  const before = await ribbon
    .locator('.ribbon-track')
    .evaluate((el) => el.style.getPropertyValue('--ring-phase'));
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x - 110, y, id: 1 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  expect(
    await ribbon
      .locator('.ribbon-track')
      .evaluate((el) => el.style.getPropertyValue('--ring-phase')),
  ).not.toBe(before);
  await expect(page).toHaveURL(/\/$/);
  const scroll = await page.evaluate(() => scrollY);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 2 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y + 100, id: 2 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(scroll);
  await ribbon.scrollIntoViewIfNeeded();
  const first = ribbon.locator('.ribbon-group:not([aria-hidden]) a').first();
  await first.focus();
  await first.tap();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
  await context.close();
});
