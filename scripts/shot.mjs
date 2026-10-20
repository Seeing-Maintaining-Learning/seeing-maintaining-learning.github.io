// Dev helper: screenshot pages of a running preview server.
// Usage: node scripts/shot.mjs <outDir> <path> [path...]   (env: BASE, THEMES=light,dark, WIDTHS=1440,375, FULL=1)
import { chromium } from 'playwright';
const [out, ...paths] = process.argv.slice(2);
const base = process.env.BASE ?? 'http://localhost:4321';
const themes = (process.env.THEMES ?? 'light').split(',');
const widths = (process.env.WIDTHS ?? '1440').split(',').map(Number);
const browser = await chromium.launch();
for (const theme of themes) for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, deviceScaleFactor: 1, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()));
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(Number(process.env.WAIT ?? 600));
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) console.log(`HSCROLL ${p} @${w}: ${sw}`);
    const name = `${out}/${p.replace(/\W+/g, '_') || 'home'}-${theme}-${w}.png`;
    await page.screenshot({ path: name, fullPage: !!process.env.FULL });
    console.log(name);
  }
  await ctx.close();
}
await browser.close();
