import { test, expect, devices } from '@playwright/test';

for (const [route, experienceLabel] of [
  ['/', 'Experiencia y formación'],
  ['/en/', 'Experience and education'],
]) {
  test(`stack desplegable: clic completo, teclado y selección persistente (${route})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const details = page.locator('#sobre-mi details');
    const stack = details.locator('.about-stack');
    await expect(stack).not.toBeVisible();
    await page.getByText(experienceLabel, { exact: true }).click();
    await expect(stack).toBeVisible();
    await expect(stack.locator('.stack-group')).toHaveCount(4);
    const development = stack.locator('[data-stack-group="development"]');
    expect(
      await development.locator('[data-tech-label]').allTextContents(),
    ).toEqual(['React', 'Inertia']);
    expect(await details.textContent()).not.toMatch(/adminanzas|mariadb/i);
    const selected = stack.locator('[data-selected="true"]');
    const tools = stack.locator('[data-stack-group="tools"]');
    const box = (await tools.boundingBox())!;
    await tools.click({ position: { x: box.width - 12, y: box.height - 12 } });
    await expect(selected).toHaveAttribute('data-stack-group', 'tools');
    await expect(tools.locator('[data-stack-select]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const projects = stack.locator('[data-stack-group="projects"]');
    await projects.locator('[data-stack-select]').focus();
    await page.keyboard.press('Space');
    await expect(selected).toHaveAttribute('data-stack-group', 'projects');
    await expect(stack.locator('[aria-pressed="true"]')).toHaveCount(1);
    await development.locator('[data-stack-select]').click();
    await expect(selected).toHaveAttribute('data-stack-group', 'development');
    await page.getByText(experienceLabel, { exact: true }).click();
    await expect(stack).not.toBeVisible();
    await page.getByText(experienceLabel, { exact: true }).click();
    await expect(selected).toHaveAttribute('data-stack-group', 'development');
    await stack
      .locator('[data-stack-group="primary"] [data-stack-select]')
      .focus();
    await page.keyboard.press('Enter');
    await expect(selected).toHaveAttribute('data-stack-group', 'primary');
    expect(
      await stack
        .locator('[data-stack-group="primary"] [data-tech-label]')
        .allTextContents(),
    ).toEqual(['PHP', 'Laravel', 'MySQL', 'Blade']);
  });
}

test('toque y etiquetas conservan selección, efectos y lectura sin movimiento', async ({
  browser,
  browserName,
}) => {
  const context = await browser.newContext(devices['iPhone 12 Pro Max']);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.locator('#sobre-mi summary').tap();
    const stack = page.locator('.about-stack');
    const tools = stack.locator('[data-stack-group="tools"]');
    await tools.scrollIntoViewIfNeeded();
    const box = (await tools.boundingBox())!;
    await tools.tap({ position: { x: box.width - 12, y: box.height - 12 } });
    await expect(stack.locator('[data-selected="true"]')).toHaveAttribute(
      'data-stack-group',
      'tools',
    );
    const php = stack
      .locator('[data-stack-group="primary"] .tech-spark')
      .first();
    await php.tap();
    await expect(stack.locator('[data-selected="true"]')).toHaveAttribute(
      'data-stack-group',
      'primary',
    );
    await expect(stack.locator('.tech-signal')).toHaveCount(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await tools.locator('[data-stack-select]').tap();
    await expect(stack.locator('[data-selected="true"]')).toHaveAttribute(
      'data-stack-group',
      'tools',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (browserName === 'chromium') {
      await tools.scrollIntoViewIfNeeded();
      const beforeScroll = await page.evaluate(() => scrollY);
      const bounds = (await tools.boundingBox())!;
      const session = await context.newCDPSession(page);
      const x = bounds.x + bounds.width / 2;
      const y = bounds.y + 24;
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y, id: 1 }],
      });
      for (let i = 1; i <= 5; i++) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y - i * 16, id: 1 }],
        });
        await page.waitForTimeout(20);
      }
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await expect
        .poll(() => page.evaluate(() => scrollY))
        .toBeGreaterThan(beforeScroll);
      await expect(stack.locator('[data-selected="true"]')).toHaveAttribute(
        'data-stack-group',
        'tools',
      );
      await session.detach();
    }
  } finally {
    await context.close();
  }
});

test('recorrido abre experiencia, conserva grupo elegido y restaura el desplegable', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const details = page.locator('#sobre-mi details');
  await details.locator('summary').click();
  await details
    .locator('[data-stack-group="development"] [data-stack-select]')
    .click();
  await details.locator('summary').click();
  await page.locator('[data-tour-start]').click();
  const tour = page.locator('.page-tour');
  await tour.locator('.tour-play').click();
  const index = await tour.evaluate((el) =>
    JSON.parse((el as HTMLElement).dataset.stops!).findIndex(
      (stop: { target: string }) => stop.target === '.about-stack',
    ),
  );
  for (let i = 0; i < index; i++) await tour.locator('.tour-forward').click();
  await expect(details).toHaveAttribute('open', '');
  await expect(tour).toHaveAttribute('data-focus', '[data-selected="true"]');
  await expect(details.locator('[data-selected="true"]')).toHaveAttribute(
    'data-stack-group',
    'development',
  );
  await tour.locator('.tour-close').click();
  await expect(details).not.toHaveAttribute('open');
  await details.locator('summary').click();
  await expect(details.locator('[data-selected="true"]')).toHaveAttribute(
    'data-stack-group',
    'development',
  );
});

test('sin JavaScript: desplegable nativo, títulos legibles y controles ocultos', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    for (const route of ['/', '/en/']) {
      const page = await context.newPage();
      await page.goto(route);
      const details = page.locator('#sobre-mi details');
      await expect(details.locator('.about-stack')).not.toBeVisible();
      await details.locator('summary').click();
      await expect(details.locator('[data-stack-title]').first()).toBeVisible();
      await expect(details.locator('[data-stack-select]:visible')).toHaveCount(
        0,
      );
      await expect(details.locator('[data-stack-hint]')).toHaveCount(0);
      await page.close();
    }
  } finally {
    await context.close();
  }
});
