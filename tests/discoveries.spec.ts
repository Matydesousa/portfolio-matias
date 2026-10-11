import { test, expect } from '@playwright/test';

test('nuevos detalles: lupa real sin mover tarjetas, etiquetas con teclado y luz al desplegar experiencia', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/proyectos/oax-demo/');
  await page.clock.runFor(1500);
  const tag = page.getByRole('button', {
    name: 'Animar tecnología HTML',
    exact: true,
  });
  const before = await tag.boundingBox();
  await tag.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('.tech-signal')).toHaveCount(1);
  expect(await tag.boundingBox()).toEqual(before);
  await page.clock.runFor(950);
  await expect(page.locator('.tech-signal')).toHaveCount(0);
  // Native CSS entrance animations need the real browser timeline to settle.
  await page.clock.resume();

  const card = page.locator('.gallery-link').first();
  const image = card.locator('img');
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator('.project-gallery')
        .evaluate((el) => getComputedStyle(el).transform),
    )
    .toBe('none');
  await expect
    .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBe(1440);
  const geometry = (el: Element) => {
    const bounds = el.getBoundingClientRect();
    const gallery = el.closest('.project-gallery')!.getBoundingClientRect();
    return {
      width: el.clientWidth,
      height: el.clientHeight,
      top: bounds.top - gallery.top,
      left: bounds.left - gallery.left,
    };
  };
  const cardBefore = await card.evaluate(geometry);
  await image.hover({ position: { x: 130, y: 100 } });
  await page.waitForTimeout(300);
  await expect(page.locator('.gallery-lens')).toHaveCount(0);
  const lens = page.locator('.gallery-lens');
  await expect(lens).toHaveCount(1);
  expect(await card.evaluate(geometry)).toEqual(cardBefore);
  expect(await lens.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe(
    'none',
  );
  const source = (await image.getAttribute('src'))!;
  expect(
    await lens.evaluate((el) => (el as HTMLElement).style.backgroundImage),
  ).toContain(source);
  const position = await lens.evaluate(
    (el) => (el as HTMLElement).style.backgroundPosition,
  );
  await image.hover({ position: { x: 250, y: 160 } });
  await page.waitForTimeout(50);
  expect(
    await lens.evaluate((el) => (el as HTMLElement).style.backgroundPosition),
  ).not.toBe(position);
  const bounds = await lens.boundingBox(),
    photo = await image.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(photo!.x);
  expect(bounds!.y).toBeGreaterThanOrEqual(photo!.y);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    photo!.x + photo!.width,
  );
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
    photo!.y + photo!.height,
  );
  await image.click();
  await expect(page.locator('.gallery-lens')).toHaveCount(0);
  await expect(page.locator('.image-viewer')).toBeVisible();
  await expect(page.locator('.image-viewer img')).toHaveAttribute(
    'src',
    source,
  );
  await page.keyboard.press('Escape');
  await expect(card).toBeFocused();

  await page.goto('/');
  const summary = page.locator('.about summary');
  await summary.scrollIntoViewIfNeeded();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience-signal')).toHaveCount(1);
  await expect(page.locator('.experience-signal circle')).toHaveCount(3);
  await page.waitForTimeout(2100);
  await expect(page.locator('.experience-signal')).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator('.experience-signal')
        .evaluate((el) => el.getAnimations({ subtree: true }).length),
    )
    .toBe(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience-signal')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience-signal')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(page.locator('.experience-signal')).toBeVisible();
  expect(
    await page
      .locator('.experience-signal')
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await expect(page.locator('.about details')).toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});

test('última tanda: firma y contacto sin interceptar enlaces; línea persistente ante scroll, resize y movimiento reducido', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/proyectos/notas-pendientes/');
  await page.clock.runFor(1500);
  const brand = page.locator('.site-header .brand');
  const box = await brand.boundingBox();
  await brand.hover();
  await page.clock.runFor(300);
  await expect(page.locator('.brand-signature')).toHaveCount(0);
  await page.clock.runFor(400);
  await expect(page.locator('.brand-signature')).toHaveCount(1);
  expect(await brand.boundingBox()).toEqual(box);
  expect(
    await page
      .locator('.brand-signature')
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe('none');
  await page
    .getByRole('button', { name: 'Pausar efectos' })
    .evaluate((el) => (el as HTMLButtonElement).click());
  await expect(page.locator('.brand-signature')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Activar efectos' })
    .evaluate((el) => (el as HTMLButtonElement).click());
  await brand.focus();
  await page.clock.runFor(600);
  await expect(page.locator('.brand-signature')).toHaveCount(1);
  await brand.click();
  await expect(page).toHaveURL(/\/$/);
  // A native page navigation can finish before module scripts attach listeners.
  await page.waitForLoadState('load');
  await expect(page.locator('html')).toHaveAttribute('data-scroll-depth', 'on');
  await expect(page.locator('.brand-signature')).toHaveCount(0);

  const email = page.locator('.contact-links a').first();
  const href = await email.getAttribute('href');
  const content = await email.textContent();
  await email.scrollIntoViewIfNeeded();
  await page.clock.runFor(1500);
  // Avoid a late native focus scroll cancelling this deliberately short effect.
  await email.evaluate((el) =>
    (el as HTMLElement).focus({ preventScroll: true }),
  );
  await page.clock.runFor(600);
  await expect(email.locator('.contact-signal')).toHaveCount(1);
  await expect(email).toHaveAttribute('href', href!);
  expect(await email.textContent()).toBe(content);
  expect(
    await email
      .locator('.contact-signal')
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe('none');
  const navigationCancelled = await email.evaluate((el) => {
    let cancelled = true;
    el.addEventListener(
      'click',
      (event) => {
        cancelled = event.defaultPrevented;
        // Prevent launching the external mail application in this test only.
        event.preventDefault();
      },
      { once: true },
    );
    (el as HTMLAnchorElement).click();
    return cancelled;
  });
  // The email now deliberately copies instead of launching a mail client.
  expect(navigationCancelled).toBe(true);
  await expect(email).toHaveAttribute('role', 'button');
  const modifiedClickCancelled = await email.evaluate((el) => {
    let cancelled = true;
    el.addEventListener(
      'click',
      (event) => {
        cancelled = event.defaultPrevented;
        event.preventDefault();
      },
      { once: true },
    );
    el.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
      }),
    );
    return cancelled;
  });
  expect(modifiedClickCancelled).toBe(false);
  await expect(page.locator('.contact-signal')).toHaveCount(0);
  const linkedin = page.locator('.contact-links a').nth(1);
  await linkedin.focus();
  await page.clock.runFor(2200);
  await expect(page.locator('.contact-signal')).toHaveCount(0);
  await expect(linkedin).toHaveAttribute('target', '_blank');

  const summary = page.locator('.about summary');
  await summary.scrollIntoViewIfNeeded();
  await page.clock.runFor(1500);
  await summary.focus();
  await page.keyboard.press('Enter');
  const rail = page.locator('.experience-signal');
  await expect(rail).toBeVisible();
  await page.clock.runFor(3000);
  await page.evaluate(() => scrollBy(0, 40));
  await page.clock.runFor(50);
  await expect(rail).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  const offsets = await page.locator('.experience-list').evaluate((list) => {
    const nodes = Array.from(
      list.querySelectorAll('.experience-signal circle'),
    );
    const headings = Array.from(list.querySelectorAll('h3'));
    return nodes.map((node, index) =>
      Math.abs(
        node.getBoundingClientRect().top +
          node.getBoundingClientRect().height / 2 -
          (headings[index].getBoundingClientRect().top +
            headings[index].getBoundingClientRect().height / 2),
      ),
    );
  });
  offsets.forEach((offset) => expect(offset).toBeLessThan(1));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(rail).toBeVisible();
  expect(
    await rail.evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  await page.locator('.site-header .brand').focus();
  await page.clock.runFor(600);
  await expect(page.locator('.brand-signature')).toHaveCount(0);
  await email.focus();
  await page.clock.runFor(600);
  await expect(page.locator('.contact-signal')).toHaveCount(0);
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(rail).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('nuevos detalles: limpieza de lupa pendiente y chips, versión táctil y alternativa sin JavaScript', async ({
  page,
  browser,
}) => {
  await page.goto('/proyectos/oax-demo/');
  const image = page.locator('.gallery-link').first().locator('img');
  await image.hover();
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(page.locator('.gallery-lens')).toHaveCount(0);
  await expect(page.locator('.tech-spark').first()).toBeHidden();
  await expect(page.locator('[data-tech-label]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Activar efectos' }).click();
  const tag = page.getByRole('button', {
    name: 'Animar tecnología HTML',
    exact: true,
  });
  await tag.scrollIntoViewIfNeeded();
  await tag.focus();
  await expect(tag).toBeFocused();
  // Dispatch the scroll cleanup before starting the keyboard interaction.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.keyboard.press('Space');
  await expect(page.locator('.tech-signal')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.tech-signal')).toHaveCount(0);
  await expect(tag).toBeHidden();
  await expect(page.locator('.site-header .brand')).toBeFocused();
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const phone = await mobile.newPage();
    await phone.goto('/proyectos/oax-demo/');
    await phone
      .getByRole('button', { name: 'Animar tecnología CSS', exact: true })
      .tap();
    await expect(phone.locator('.tech-signal')).toHaveCount(1);
    await phone.locator('.gallery-link').first().tap();
    await expect(phone.locator('.image-viewer')).toBeVisible();
    await expect(phone.locator('.tech-signal')).toHaveCount(0);
    await expect(phone.locator('.gallery-lens')).toHaveCount(0);
    await phone.locator('.image-viewer-close').tap();
    await phone.goto('/');
    await phone.locator('.about summary').tap();
    await expect(phone.locator('.experience-signal')).toHaveCount(1);
    expect(
      await phone.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
  } finally {
    await mobile.close();
  }
  const plain = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await plain.newPage();
    await page.goto('/proyectos/oax-demo/');
    await expect(page.locator('.tech-spark').first()).toBeHidden();
    await expect(page.locator('[data-tech-label]').first()).toHaveText('HTML');
    await expect(page.locator('[data-tech-label]').first()).toBeVisible();
    await expect(page.locator('.gallery-link')).toHaveCount(5);
  } finally {
    await plain.close();
  }
});

test('descubrimientos: nombre, fondo y miniaturas sin alterar la navegación', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const epoch = new Date('2026-10-09T12:00:00Z');
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(epoch);
  await page.goto('/');
  await page.clock.runFor(2000);
  const spark = page.getByRole('button', { name: 'Animar mi nombre' });
  const sky = page.locator('.discovery-sky');
  await expect(spark).toBeVisible();
  await expect(page.locator('.discovery-constellation')).toHaveCount(0);
  expect(await sky.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe(
    'none',
  );
  await page.locator('.intro-letter').nth(3).hover();
  expect(
    await page
      .locator('.intro-letter')
      .evaluateAll((letters) =>
        letters.some((letter) =>
          letter
            .getAnimations()
            .some(
              (animation) =>
                animation.playState === 'running' &&
                (animation.effect as KeyframeEffect)
                  .getKeyframes()
                  .some((frame) => frame.translate),
            ),
        ),
      ),
  ).toBe(true);
  await spark.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.discovery-constellation')).toHaveCount(1);
  await page.clock.runFor(2100);
  await expect(page.locator('.discovery-constellation')).toHaveCount(0);
  await page.mouse.dblclick(40, 190);
  await expect(page.locator('.discovery-constellation')).toHaveCount(1);
  await page.clock.runFor(2100);
  await page.locator('.intro-letter').first().dblclick();
  await expect(page.locator('.discovery-constellation')).toHaveCount(0);
  await page.evaluate(() => window.getSelection()?.removeAllRanges());

  const row = page.locator('.repository-link').first();
  const href = await row.getAttribute('href');
  await row.scrollIntoViewIfNeeded();
  await row.locator('.thumbnail-frame').hover();
  await page.clock.runFor(300);
  await expect(page.locator('.discovery-circuit')).toHaveCount(0);
  await page.clock.runFor(1000);
  await expect(page.locator('.discovery-circuit')).toHaveCount(1);
  expect(
    await page
      .locator('.discovery-circuit')
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe('none');
  await expect(row).toHaveAttribute('href', href!);
  await row.locator('.thumbnail-frame').click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\//);
  await expect(page.locator('.discovery-circuit')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('descubrimientos se limpian con pausa, recorrido y movimiento reducido; tap funciona en móvil', async ({
  page,
  browser,
}) => {
  await page.goto('/');
  const spark = page.getByRole('button', { name: 'Animar mi nombre' });
  const first = page.locator('.repository-link').first();
  await first.focus();
  await expect(page.locator('.discovery-circuit')).toHaveCount(1);
  await page.getByRole('button', { name: 'Pausar efectos' }).click();
  await expect(page.locator('.discovery-circuit')).toHaveCount(0);
  await expect(spark).toBeHidden();
  await expect(page.locator('[data-name-dot]')).toBeVisible();
  await page.getByRole('button', { name: 'Activar efectos' }).click();
  await spark.click();
  await expect(page.locator('.discovery-constellation')).toHaveCount(1);
  await page.getByRole('button', { name: 'Recorrer el portfolio' }).click();
  await expect(page.locator('.discovery-constellation')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.intro h1')).toBeFocused();
  await spark.focus();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(spark).toBeHidden();
  await expect(page.locator('.site-header .brand')).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Matías De Sousa', exact: true }),
  ).toBeVisible();

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const mobile = await context.newPage();
    await mobile.goto('/');
    await mobile.getByRole('button', { name: 'Animar mi nombre' }).tap();
    await expect(mobile.locator('.discovery-constellation')).toHaveCount(1);
    expect(
      await mobile.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await mobile
      .getByRole('link', { name: 'OAX · Gestión comercial', exact: true })
      .tap();
    await expect(mobile).toHaveURL(/\/proyectos\/oax-demo\//);
  } finally {
    await context.close();
  }
});
