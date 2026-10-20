// Render 1200x630 Open Graph images into public/og/. Run locally after design changes:
//   node scripts/og.mjs
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const FONT = readFileSync('node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2').toString('base64');
const systems = JSON.parse(readFileSync('src/data/generated/systems.json', 'utf8'));
const OUT = 'public/og';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['default', 'Seeing, Maintaining, and Learning', 'The Evolution of Multimodal Agent Memory'],
  ['formation', 'How raw experience becomes memory', 'Six representation forms, hybrids, storage, and retrieval'],
  ['management', 'What can change while the agent runs?', 'T1 static · T2 dynamic · T3 self-evolving memory'],
  ['modalities', 'Agent memory by modality', 'Image · Video · Audio · GUI · Embodied'],
  ['systems', `${systems.length} multimodal memory systems`, 'Filter by modality, representation, storage, retrieval, and tier'],
  ['benchmarks', 'What memory benchmarks test', '82 benchmarks across 21 memory capabilities'],
];

const MOD = { image: '#2a78d6', video_streaming: '#eb6834', audio_speech: '#1baf7a', gui: '#eda100', embodied_3d: '#e87ba4' };
const ORDER = Object.keys(MOD);
const sorted = [...systems].sort((a, b) => ORDER.indexOf(a.modality) - ORDER.indexOf(b.modality));
const G = Math.PI * (3 - Math.sqrt(5));
const dots = sorted
  .map((s, i) => {
    const r = 15.5 * Math.sqrt(i + 0.5);
    const a = i * G;
    return `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="6" fill="${MOD[s.modality]}" stroke="#f3f5f7" stroke-width="1.5"/>`;
  })
  .join('');

const html = (title, sub) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  @font-face { font-family: SG; src: url(data:font/woff2;base64,${FONT}); font-weight: 100 900; }
  body { margin: 0; width: 1200px; height: 630px; background: #f3f5f7; font-family: SG, sans-serif; color: #16202a; overflow: hidden; position: relative; }
  .txt { position: absolute; left: 72px; top: 72px; width: 640px; }
  h1 { font-size: 64px; line-height: 1.02; letter-spacing: -0.03em; margin: 0 0 24px; font-weight: 700; }
  p { font-size: 28px; line-height: 1.3; color: #3c4752; margin: 0; }
  .foot { position: absolute; left: 72px; bottom: 56px; font-size: 22px; color: #5b6672; }
  svg { position: absolute; right: -40px; top: 50%; transform: translateY(-50%); }
</style></head><body>
<div class="txt"><h1>${title}</h1><p>${sub}</p></div>
<div class="foot">seeing-maintaining-learning.github.io</div>
<svg width="560" height="560" viewBox="-280 -280 560 560">${dots}</svg>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, title, sub] of PAGES) {
  await page.setContent(html(title, sub), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`${OUT}/${name}.png`);
}
await browser.close();
