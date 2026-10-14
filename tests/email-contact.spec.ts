import { test, expect, devices } from '@playwright/test';

for (const route of ['/', '/en/']) {
  test(`contacto: selector accesible, destinos y foco (${route})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const trigger = page.locator('.intro-actions [data-email-contact]');
    const dialog = page.locator('.email-options');
    await expect(trigger).toHaveJSProperty('tagName', 'BUTTON');
    await trigger.focus();
    await page.keyboard.press('Space');
    await expect(dialog).toBeVisible();
    const gmail = dialog.locator('a').nth(0);
    await expect(gmail).toBeFocused();
    const gmailURL = new URL((await gmail.getAttribute('href'))!);
    expect(gmailURL.origin).toBe('https://mail.google.com');
    expect(gmailURL.searchParams.get('to')).toBe('matydesousa06@gmail.com');
    await expect(gmail).toHaveAttribute('target', '_blank');
    const outlook = dialog.locator('a').nth(1);
    const outlookURL = new URL((await outlook.getAttribute('href'))!);
    expect(outlookURL.origin).toBe('https://outlook.live.com');
    expect(outlookURL.pathname).toBe('/mail/0/deeplink/compose');
    expect(outlookURL.searchParams.get('to')).toBe('matydesousa06@gmail.com');
    await expect(dialog.locator('a').nth(2)).toHaveAttribute(
      'href',
      'mailto:matydesousa06@gmail.com',
    );
    await page.keyboard.press('Tab');
    await expect(outlook).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(page.locator('#contacto [data-email-contact]')).toHaveCount(0);
    await expect(page.locator('#contacto [data-copy-email]')).toBeVisible();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('.email-options-close').click();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.mouse.click(2, 2);
    await expect(dialog).not.toBeVisible();
  });

  test(`contacto táctil: selector y copia de correo conservada (${route})`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext(devices['iPhone 12 Pro Max']);
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: async (text: string) => {
            document.documentElement.dataset.copiedEmail = text;
          },
        },
      });
    });
    const page = await context.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${baseURL}${route}`);
    const trigger = page.locator('.intro-actions [data-email-contact]');
    await expect(trigger).toHaveJSProperty('tagName', 'BUTTON');
    await trigger.tap();
    await expect(page.locator('.email-options')).toBeVisible();
    await page.locator('.email-options-close').tap();
    await expect(page.locator('.email-options')).not.toBeVisible();
    const email = page.locator('[data-copy-email]');
    await expect(email).toHaveJSProperty('tagName', 'BUTTON');
    await email.tap();
    await expect(page.locator('html')).toHaveAttribute(
      'data-copied-email',
      'matydesousa06@gmail.com',
    );
    await expect(page.locator('.email-copy-status')).not.toBeEmpty();
    await context.close();
  });
}

test('sin JavaScript, solo la opción de aplicación tiene mailto', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/', '/en/']) {
    await page.goto(`${baseURL}${route}`);
    for (const selector of ['[data-email-contact]', '[data-copy-email]']) {
      const control = page.locator(selector);
      await expect(control).toBeVisible();
      await expect(control).toHaveAttribute('type', 'button');
      await expect(control).not.toHaveAttribute('href');
      expect(await control.evaluate((el) => el.closest('a'))).toBeNull();
    }
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
    await expect(page.locator('.email-options')).not.toBeVisible();
  }
  await context.close();
});

for (const withHandler of [false, true]) {
  for (const route of ['/', '/en/']) {
    test(`acciones exclusivas, manejador mailto ${withHandler}: ${route}`, async ({
      page,
      context,
    }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(route);
      // Reproduce the installed extension's independent per-anchor listener.
      // preventDefault in the application cannot cancel another click listener.
      await page.evaluate((enabled) => {
        document.documentElement.dataset.mailtoLaunches = '0';
        if (!enabled) return;
        for (const link of document.links) {
          if (!/^mailto:/i.test(link.href)) continue;
          link.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const root = document.documentElement;
            root.dataset.mailtoLaunches = String(
              Number(root.dataset.mailtoLaunches) + 1,
            );
          });
        }
      }, withHandler);
      const originalURL = page.url();
      const popups: string[] = [];
      context.on('page', (popup) => popups.push(popup.url()));
      const trigger = page.locator('[data-email-contact]');
      const copy = page.locator('[data-copy-email]');
      const dialog = page.locator('.email-options');
      for (const selector of ['[data-email-contact]', '[data-copy-email]']) {
        expect(
          await page.locator(selector).evaluate((el) => el.closest('a')),
        ).toBeNull();
        await expect(page.locator(selector)).not.toHaveAttribute('href');
      }
      for (const modifiers of [
        [],
        ['Control'],
        ['Shift'],
        ['Alt'],
        ['Meta'],
      ] as const) {
        await trigger.click({ modifiers: [...modifiers] });
        await expect(dialog).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await copy.click({ modifiers: [...modifiers] });
        await expect(copy).toHaveAttribute('data-copied', 'true');
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
          'matydesousa06@gmail.com',
        );
        await expect(dialog).not.toBeVisible();
      }
      for (const key of ['Enter', 'Space']) {
        await trigger.focus();
        await page.keyboard.press(key);
        await expect(dialog).toBeVisible();
        await page.keyboard.press('Escape');
        await copy.focus();
        await page.keyboard.press(key);
        await expect(page.locator('.email-copy-status')).toHaveText(
          route === '/' ? 'Correo copiado.' : 'Email copied.',
        );
      }
      await expect(page).toHaveURL(originalURL);
      expect(popups).toEqual([]);
      await expect(page.locator('html')).toHaveAttribute(
        'data-mailto-launches',
        '0',
      );
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
      await trigger.click();
      if (withHandler) {
        await dialog.locator('a[href^="mailto:"]').click();
        await expect(page.locator('html')).toHaveAttribute(
          'data-mailto-launches',
          '1',
        );
      }
      // Verify service navigation without signing in or sending email.
      await context.route(
        /^https:\/\/(mail\.google\.com|outlook\.live\.com)\//,
        (route) => route.fulfill({ body: 'Compose destination' }),
      );
      for (const origin of [
        'https://mail.google.com',
        'https://outlook.live.com',
      ]) {
        const popupPromise = page.waitForEvent('popup');
        await dialog.locator(`a[href^="${origin}"]`).click();
        const popup = await popupPromise;
        await popup.waitForLoadState();
        expect(new URL(popup.url()).origin).toBe(origin);
        expect(new URL(popup.url()).searchParams.get('to')).toBe(
          'matydesousa06@gmail.com',
        );
        await popup.close();
      }
    });
  }
}
