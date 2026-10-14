import { test, expect } from '@playwright/test';
import { projects } from '../src/data/projects';
import { getProjects } from '../src/i18n/content';

test('English homepage, language switch, metadata and localized navigation', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'English', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(
    page.getByRole('heading', { name: 'Public projects' }),
  ).toBeVisible();
  await expect(page.locator('.intro-description')).toContainText(
    'Computer Engineering at UADE',
  );
  await expect(page.locator('.about')).toContainText('Argentine Army');
  await expect(page.locator('.about')).not.toContainText('Adminanzas');
  await expect(page.locator('.about-stack')).not.toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Computer Engineering student/,
  );
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
    'content',
    'en_US',
  );
  await expect(
    page.getByRole('link', { name: 'English', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    page.getByRole('link', { name: 'Español', exact: true }),
  ).not.toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.motion-toggle')).toHaveText('Reduced motion');
  await expect(page.locator('.repository-link')).toHaveCount(5);
  for (const project of getProjects('en'))
    await expect(
      page.locator(`.repository-link[href="/en/projects/${project.slug}/"]`),
    ).toContainText(project.title);
  await page.getByRole('link', { name: 'About me', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/#sobre-mi$/);
  await page.getByText('Experience and education', { exact: true }).click();
  await expect(page.locator('.experience-list')).toContainText('IT technician');
  await page.getByRole('link', { name: 'Español', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(
    page.getByRole('heading', { name: 'Proyectos públicos' }),
  ).toBeVisible();
});

for (const project of getProjects('en')) {
  test(`English detail, gallery, tour and language round trip: ${project.slug}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/en/projects/${project.slug}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.case-header h1')).toContainText(project.title);
    await expect(
      page.getByRole('heading', { name: 'Main features', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.project-features > div')).toHaveCount(4);
    await expect(page.locator('.project-features')).toContainText(
      project.features[0].description,
    );
    await expect(page.locator('.project-example')).toContainText(
      project.example,
    );
    await expect(page.locator('[aria-labelledby="scope-title"]')).toContainText(
      project.scope,
    );
    await expect(page.locator('.case-image img')).toHaveAttribute(
      'src',
      project.image!,
    );
    await expect(page.locator('.case-image img')).toHaveAttribute(
      'alt',
      project.imageAlt!,
    );
    await expect(page.locator('.original-interface')).toContainText(
      'original Spanish-language',
    );
    await expect(
      page.getByRole('link', { name: 'View repository on GitHub' }),
    ).toHaveAttribute('href', project.repository);
    await expect(page.locator('.case-next')).toHaveCount(0);
    await expect(page.locator('.ribbon-card')).toHaveCount(5);
    await expect(page.locator('.ribbon-card').first()).toHaveAttribute(
      'href',
      /^\/en\/projects\//,
    );
    const gallery = page.locator('[data-gallery-index]').first();
    await gallery.click();
    const viewer = page.locator('.image-viewer');
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('.image-counter')).toHaveText(
      `2 of ${project.gallery!.length + 1}`,
    );
    await expect(viewer.locator('#image-viewer-caption')).toContainText(
      project.gallery![0].description!,
    );
    await viewer
      .getByRole('button', { name: 'Next image', exact: true })
      .click();
    await expect(viewer.locator('.image-counter')).toHaveText(
      `${project.gallery!.length === 1 ? 1 : 3} of ${project.gallery!.length + 1}`,
    );
    await page.keyboard.press('Escape');
    await expect(gallery).toBeFocused();
    await page.getByRole('button', { name: 'Explore this project' }).click();
    const tour = page.locator('.page-tour');
    await expect(tour.locator('.tour-card-top')).toContainText('Guided tour');
    await tour.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(
      tour.getByRole('button', { name: 'Continue', exact: true }),
    ).toBeVisible();
    const stops = await tour.evaluate(
      (el) =>
        JSON.parse((el as HTMLElement).dataset.stops!) as {
          target: string;
          focus?: string;
          title: string;
          message: string;
        }[],
    );
    for (const stop of stops.slice(1)) {
      await tour.locator('.tour-next').click();
      await expect(tour.getByRole('heading')).toHaveText(stop.title);
      await expect(tour.locator('#tour-message')).toHaveText(stop.message);
      await expect(tour).toHaveAttribute('data-focus', stop.focus || '');
    }
    await expect(tour.locator('.tour-next')).toHaveText('Finish');
    await page.keyboard.press('Escape');
    await expect(
      page.locator('.tour-focus-image, .tour-focus-window, .tour-scroll-space'),
    ).toHaveCount(0);
    await page.getByRole('link', { name: 'Español', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/proyectos/${project.slug}/$`));
    await expect(page.locator('.case-header h1')).toContainText(
      projects.find((item) => item.slug === project.slug)!.title,
    );
    await page.getByRole('link', { name: 'English', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/en/projects/${project.slug}/$`));
  });
}

test('English homepage tour opens the corresponding English project', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/');
  await page.getByRole('button', { name: 'Explore the portfolio' }).click();
  const tour = page.locator('.page-tour');
  await tour.getByRole('button', { name: 'Pause', exact: true }).click();
  await tour.getByRole('button', { name: 'Next stop', exact: true }).click();
  await expect(tour.getByRole('heading')).toHaveText(
    'OAX · Business management',
  );
  await tour.getByRole('link', { name: 'View this project' }).click();
  await expect(page).toHaveURL(/\/en\/projects\/oax-demo\/$/);
});

test('English pages and language navigation work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/');
  await expect(page.locator('.contact-email button')).toHaveCount(1);
  await expect(page.locator('[data-copy-email]')).not.toHaveAttribute('href');
  await page.locator('.repository-link').first().click();
  await expect(page).toHaveURL(/\/en\/projects\/oax-demo\/$/);
  await expect(
    page.getByRole('heading', { name: 'Technical decisions', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.gallery-grid a').first()).toHaveAttribute(
    'href',
    '/images/oax-sitio.jpg',
  );
  await page.getByRole('link', { name: 'Español', exact: true }).click();
  await expect(page).toHaveURL(/\/proyectos\/oax-demo\/$/);
  await context.close();
});

test('copy email writes the correct address and confirms it in both languages', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'http://127.0.0.1:4321',
  });
  await page.clock.install();
  const confirmationStatus = page.locator('.contact-email [role="status"]');
  for (const [path, label, confirmation] of [
    ['/', 'Copiar correo', 'Correo copiado.'],
    ['/en/', 'Copy email', 'Email copied.'],
  ]) {
    await page.goto(path);
    const button = page.getByRole('button', {
      name: `${label}: matydesousa06@gmail.com`,
      exact: true,
    });
    await expect(page.locator('.contact-email button')).toHaveCount(1);
    await expect(button).toHaveText('matydesousa06@gmail.com');
    await button.click();
    await expect(confirmationStatus).toHaveText(confirmation);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(confirmationStatus).toHaveText(confirmation);
    await expect(button).toHaveAttribute('data-copied', 'true');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'matydesousa06@gmail.com',
    );
    await expect(button).toBeFocused();
    await page.keyboard.press('Space');
    await expect(confirmationStatus).toHaveText(confirmation);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.clock.fastForward(4000);
    await expect(confirmationStatus).toBeEmpty();
    await expect(button).not.toHaveAttribute('data-copied');
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/matias-de-sousa-0aa180426',
    );
  }
});

test('clipboard rejection selects the email and reports failure without false confirmation', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {
          throw new Error('Clipboard denied');
        },
      },
    }),
  );
  for (const [path, label, error] of [
    ['/', 'Copiar correo', 'No pude copiarlo automáticamente.'],
    ['/en/', 'Copy email', 'Automatic copying failed.'],
  ]) {
    await page.goto(path);
    await page
      .getByRole('button', {
        name: `${label}: matydesousa06@gmail.com`,
        exact: true,
      })
      .click();
    await expect(page.locator('.contact-email [role="status"]')).toContainText(
      error,
    );
    expect(await page.evaluate(() => getSelection()?.toString())).toBe(
      'matydesousa06@gmail.com',
    );
    await expect(page.locator('.contact-email-action')).not.toHaveAttribute(
      'data-copied',
      'true',
    );
  }
});

for (const [width, zoom] of [
  [320, 1],
  [390, 2],
  [1440, 1],
]) {
  test(`English layout and complete tour frames: ${width}px, text ${zoom * 100}%`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 844 });
    for (const path of [
      '/en/',
      ...getProjects('en').map((project) => `/en/projects/${project.slug}/`),
    ]) {
      await page.goto(path);
      if (zoom === 2)
        await page.evaluate(
          () => (document.documentElement.style.fontSize = '200%'),
        );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.locator('[data-tour-start]').click();
      const tour = page.locator('.page-tour');
      await tour.locator('.tour-play').click();
      const count = await tour.evaluate(
        (el) => JSON.parse((el as HTMLElement).dataset.stops!).length as number,
      );
      for (let i = 0; i < count; i++) {
        if (i) await tour.locator('.tour-next').click();
        const geometry = await tour.evaluate((el) => {
          const root = document.querySelector(
            (el as HTMLElement).dataset.target!,
          )!;
          const focus = (el as HTMLElement).dataset.focus;
          const f = (
            focus ? root.querySelector(focus)! : root
          ).getBoundingClientRect();
          const s = el
            .querySelector('.tour-spotlight')!
            .getBoundingClientRect();
          const card = el.querySelector<HTMLElement>('.tour-card')!;
          const c = card.getBoundingClientRect();
          return {
            complete:
              !root.closest('.case-main') ||
              (s.left <= f.left &&
                s.top <= f.top &&
                s.right >= f.right &&
                s.bottom >= f.bottom),
            fits:
              c.left >= 0 &&
              c.top >= 0 &&
              c.right <= innerWidth &&
              c.bottom <= innerHeight,
            overflow: card.scrollWidth > card.clientWidth,
            overlap:
              Math.max(
                0,
                Math.min(c.right, s.right) - Math.max(c.left, s.left),
              ) *
              Math.max(
                0,
                Math.min(c.bottom, s.bottom) - Math.max(c.top, s.top),
              ),
          };
        });
        expect(geometry.complete).toBe(true);
        expect(geometry.fits).toBe(true);
        expect(geometry.overflow).toBe(false);
        expect(geometry.overlap).toBe(0);
      }
      await page.keyboard.press('Escape');
    }
  });
}
