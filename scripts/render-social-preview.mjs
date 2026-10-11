import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Code-owned artwork: render the editable layout with the site's local font.
const font = await readFile(
  new URL(
    '../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
    import.meta.url,
  ),
);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || undefined,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const [locale, description, caption] of [
    [
      'es',
      'Software y sistemas de gestión',
      'Proyectos · Ingeniería Informática · UADE',
    ],
    [
      'en',
      'Software and management systems',
      'Projects · Computer Engineering · UADE',
    ],
  ]) {
    const points = Array.from({ length: 36 }, (_, index) => {
      const angle = (index * Math.PI * 2) / 36;
      return [938 + Math.cos(angle) * 170, 283 + Math.sin(angle) * 186];
    });
    const mesh = points
      .map(([x, y], index) => {
        const [nx, ny] = points[(index + 11) % points.length];
        return `<path d="M${x},${y}L${nx},${ny}"/>`;
      })
      .join('');
    await page.setContent(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
      @font-face {font-family:Manrope;src:url(data:font/woff2;base64,${font.toString('base64')});font-weight:200 800}
      *{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#0b1426;font-family:Manrope,sans-serif}
      svg{position:absolute;inset:0}.copy{position:absolute;inset:65px 70px;display:flex;flex-direction:column;justify-content:center}
      .brand{position:absolute;top:0;font-size:29px;font-weight:750;letter-spacing:-1px;color:#e4ecf8}.brand span{color:#8bb9ff}
      .eyebrow{margin:18px 0 19px;color:#9bb5d9;letter-spacing:4px;font-size:14px;text-transform:uppercase}
      h1{margin:0;color:#f0f4fb;font-size:62px;font-weight:700;line-height:1.16;letter-spacing:-2.6px}
      .role{margin:19px 0 0;color:#8bb9ff;font-size:30px;font-weight:600;letter-spacing:-.5px}
      .description{margin:15px 0 0;color:#b5c6de;font-size:23px}
      footer{position:absolute;bottom:0;left:0;right:0;display:flex;justify-content:space-between;border-top:1px solid #2a3b54;padding-top:24px;color:#91a7c6;font-size:15px}
      footer b{color:#b6cced;font-weight:500}
    </style></head><body><svg viewBox="0 0 1200 630" aria-hidden="true"><defs><radialGradient id="light"><stop stop-color="#28496e" stop-opacity=".55"/><stop offset="1" stop-color="#0b1426" stop-opacity="0"/></radialGradient><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#829fc5" opacity=".12"/></pattern></defs><rect width="1200" height="630" fill="url(#dots)"/><ellipse cx="965" cy="275" rx="370" ry="310" fill="url(#light)"/><g fill="none" stroke="#8bb9ff" stroke-opacity=".19" stroke-width="1">${mesh}</g><ellipse cx="938" cy="283" rx="220" ry="66" transform="rotate(-24 938 283)" fill="none" stroke="#cadbf4" stroke-opacity=".22"/><circle cx="1129" cy="192" r="3" fill="#adc9ee" opacity=".5"/></svg><main class="copy"><div class="brand">mds<span>.</span></div><p class="eyebrow">Portfolio</p><h1>Matías De Sousa<span style="color:#8bb9ff">.</span></h1><p class="role">Full Stack Developer</p><p class="description">${description}</p><footer><span>${caption}</span><b>github.com/Matydesousa</b></footer></main></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: fileURLToPath(
        new URL(
          `../public/images/social-preview-${locale}.png`,
          import.meta.url,
        ),
      ),
    });
  }
} finally {
  await browser.close();
}
