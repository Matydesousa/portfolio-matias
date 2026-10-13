import { test, expect, devices } from '@playwright/test';

for (const route of ['/', '/en/']) {
  test(`contacto: selector accesible, destinos y foco (${route})`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const trigger = page.locator('.intro-actions [data-email-contact]');
    const dialog = page.locator('.email-options');
    await expect(trigger).toHaveAttribute('role', 'button');
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
    await expect(trigger).toHaveAttribute('role', 'button');
    await trigger.tap();
    await expect(page.locator('.email-options')).toBeVisible();
    await page.locator('.email-options-close').tap();
    await expect(page.locator('.email-options')).not.toBeVisible();
    const email = page.locator('[data-copy-email]');
    await expect(email).toHaveAttribute('role', 'button');
    await email.tap();
    await expect(page.locator('html')).toHaveAttribute(
      'data-copied-email',
      'matydesousa06@gmail.com',
    );
    await expect(page.locator('.email-copy-status')).not.toBeEmpty();
    await context.close();
  });
}

test('contacto sin JavaScript: enlaces nativos de correo', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const route of ['/', '/en/']) {
    await page.goto(`${baseURL}${route}`);
    await expect(page.locator('[data-email-contact]')).toHaveCount(1);
    for (const link of await page.locator('[data-email-contact]').all()) {
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        'href',
        'mailto:matydesousa06@gmail.com',
      );
      await expect(link).not.toHaveAttribute('role');
    }
    await expect(page.locator('.email-options')).not.toBeVisible();
  }
  await context.close();
});
