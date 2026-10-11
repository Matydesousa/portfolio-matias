import { test, expect, type Locator } from '@playwright/test';
import { projects } from '../src/data/projects';

test('visor centrado en la imagen: controles compactos y ayuda opcional ES/EN', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const locale of ['es', 'en']) {
    for (const [width, height, textScale] of [
      [1677, 890, 1],
      [768, 480, 1],
      [390, 844, 1],
      [390, 844, 2],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(
        `${locale === 'en' ? '/en/projects' : '/proyectos'}/oax-demo/`,
      );
      if (textScale === 2)
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
      await page.locator('[data-image-open]').click();
      const viewer = page.locator('.image-viewer');
      const stage = viewer.locator('.image-viewport');
      const info = viewer.locator('.image-info-toggle');
      const details = viewer.locator('.image-viewer-details');
      await expect(details).toBeHidden();
      await expect(info).toHaveAttribute('aria-expanded', 'false');
      const b = (await stage.boundingBox())!;
      expect(b.height / height).toBeGreaterThan(width >= 1000 ? 0.8 : 0.7);
      expect(b.width / width).toBeGreaterThan(0.9);
      const image = (await viewer.locator('img').boundingBox())!;
      expect(image.width / image.height).toBeCloseTo(1.5, 3);
      expect(image.x).toBeGreaterThanOrEqual(b.x - 1);
      expect(image.y).toBeGreaterThanOrEqual(b.y - 1);
      expect(image.y + image.height).toBeLessThanOrEqual(b.y + b.height + 1);
      expect(
        await viewer.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await info.click();
      await expect(info).toHaveAttribute('aria-expanded', 'true');
      await expect(details).toBeVisible();
      await expect(viewer.locator('#image-viewer-caption')).not.toBeEmpty();
      await expect(viewer.locator('#image-zoom-help')).toBeVisible();
      await viewer.locator('.image-next').click();
      await expect(viewer.locator('#image-viewer-caption')).toContainText(
        'OAX',
      );
      await info.click();
      await expect(details).toBeHidden();
      expect((await stage.boundingBox())!.height).toBeCloseTo(b.height, 0);
      await page.keyboard.press('Escape');
    }
  }
});

async function geometry(stage: Locator) {
  return stage.evaluate((element) => {
    const s = element.getBoundingClientRect();
    const image = element.querySelector('img')!;
    const i = image.getBoundingClientRect();
    return {
      sx: s.x,
      sy: s.y,
      sw: s.width,
      sh: s.height,
      x: i.x,
      y: i.y,
      w: i.width,
      h: i.height,
      ratio:
        Number(image.getAttribute('width')) /
        Number(image.getAttribute('height')),
    };
  });
}

for (const locale of ['es', 'en']) {
  test(`zoom en cinco proyectos, proporciones, galería y texto ampliado: ${locale}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [1440, 320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const project of projects) {
        await page.goto(
          `${locale === 'en' ? '/en/projects' : '/proyectos'}/${project.slug}/`,
        );
        if (width === 390)
          await page.evaluate(() => {
            document.documentElement.style.fontSize = '200%';
          });
        const trigger = page.locator('[data-image-open]');
        await trigger.click();
        const viewer = page.locator('.image-viewer');
        const stage = viewer.locator('.image-viewport');
        const before = await geometry(stage);
        expect(before.w / before.h).toBeCloseTo(before.ratio, 3);
        expect(before.w).toBeLessThanOrEqual(before.sw + 1);
        expect(before.h).toBeLessThanOrEqual(before.sh + 1);
        await viewer.locator('[data-zoom-in]').click();
        await expect(viewer.locator('.image-zoom-level')).toHaveText('150%');
        const after = await geometry(stage);
        expect(after.w / before.w).toBeCloseTo(1.5, 3);
        expect(after.w / after.h).toBeCloseTo(after.ratio, 3);
        await viewer.locator('[data-zoom-fit]').click();
        await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
        await viewer.locator('[data-zoom-in]').click();
        await viewer.locator('.image-next').click();
        await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
        await expect(viewer.locator('.image-counter')).toContainText(
          locale === 'es' ? '2 de' : '2 of',
        );
        const second = await geometry(stage);
        expect(second.w / second.h).toBeCloseTo(second.ratio, 3);
        const bounds = await viewer.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
        expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
        expect(
          await viewer.evaluate((el) => el.scrollWidth <= el.clientWidth),
        ).toBe(true);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await trigger.click();
        await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
        await page.keyboard.press('Escape');
      }
    }
    expect(errors).toEqual([]);
  });
}

test('rueda anclada al cursor, arrastre limitado y teclado sin alterar la galería', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/proyectos/oax-demo/');
  await page.locator('[data-image-open]').click();
  const viewer = page.locator('.image-viewer');
  const stage = viewer.locator('.image-viewport');
  // Once the image exceeds the viewport, edge constraints no longer force
  // a centred fit and the cursor anchor can be preserved exactly.
  for (let i = 0; i < 3; i++) await viewer.locator('[data-zoom-in]').click();
  const before = await geometry(stage);
  const px = before.sx + before.sw / 2 + 80;
  const py = before.sy + before.sh / 2;
  await page.mouse.move(px, py);
  await page.mouse.wheel(0, -120);
  await expect(stage).toHaveAttribute('data-zoomed', 'true');
  const after = await geometry(stage);
  expect((px - after.x) / after.w).toBeCloseTo((px - before.x) / before.w, 3);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(px + 1000, py + 1000, { steps: 6 });
  await page.mouse.up();
  const dragged = await geometry(stage);
  expect(dragged.x).toBeLessThanOrEqual(dragged.sx + 1);
  expect(dragged.y).toBeLessThanOrEqual(dragged.sy + 1);
  expect(dragged.x + dragged.w).toBeGreaterThanOrEqual(
    dragged.sx + dragged.sw - 1,
  );
  expect(dragged.y + dragged.h).toBeGreaterThanOrEqual(
    dragged.sy + dragged.sh - 1,
  );
  await stage.focus();
  await page.keyboard.press('ArrowRight');
  expect((await geometry(stage)).x).toBeLessThan(dragged.x);
  await expect(viewer.locator('.image-counter')).toHaveText('1 de 6');
  await page.keyboard.press('0');
  await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
  await stage.dblclick();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('250%');
  await stage.dblclick();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
  for (let i = 0; i < 8; i++) await page.keyboard.press('+');
  await expect(viewer.locator('.image-zoom-level')).toHaveText('800%');
  await expect(viewer.locator('[data-zoom-in]')).toBeDisabled();
  await viewer.locator('[data-zoom-out]').click();
  await expect(viewer.locator('[data-zoom-in]')).toBeEnabled();
  await page.setViewportSize({ width: 768, height: 480 });
  await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
  await viewer.locator('.image-viewer-close').focus();
  await page.keyboard.press('ArrowRight');
  await expect(viewer.locator('.image-counter')).toHaveText('2 de 6');
});

test('gestos táctiles reales: pellizco, arrastre, doble toque y cierre', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/projects/simulador-ferroviario/');
  const trigger = page.locator('[data-image-open]');
  await trigger.tap();
  const viewer = page.locator('.image-viewer');
  const stage = viewer.locator('.image-viewport');
  const g = await geometry(stage);
  const x = g.sx + g.sw / 2,
    y = g.sy + g.sh / 2;
  const touch = await context.newCDPSession(page);
  const points = (distance: number) => [
    { x: x - distance, y, id: 1 },
    { x: x + distance, y, id: 2 },
  ];
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: points(30),
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: points(90),
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  await expect
    .poll(async () =>
      Number(
        (await viewer.locator('.image-zoom-level').textContent())!.replace(
          '%',
          '',
        ),
      ),
    )
    .toBeGreaterThan(250);
  const zoomed = await geometry(stage);
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 3 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x + 55, y: y + 35, id: 3 }],
  });
  await touch.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
  const moved = await geometry(stage);
  expect(moved.x).toBeGreaterThan(zoomed.x);
  await viewer.locator('[data-zoom-fit]').tap();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
  await stage.tap();
  await stage.tap();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('250%');
  await stage.tap();
  await stage.tap();
  await expect(viewer.locator('.image-zoom-level')).toHaveText('100%');
  await viewer.locator('.image-viewer-close').tap();
  await expect(viewer).toBeHidden();
  await expect(trigger).toBeFocused();
  await context.close();
});
