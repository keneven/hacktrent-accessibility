// Accessibility audit: saves raw results and review screenshots to a11y-audit/
//
//   npm run audit                              -> audits this site into a11y-audit/after
//   node tests/audit.mjs <siteDir> <outDir>    -> audit any folder (we used it on the original starter)
//
// For each page, in light and dark mode: axe-core (WCAG 2.0/2.1/2.2 A + AA) and the
// IBM Equal Access engine. Also takes colour-vision-deficiency screenshots of the home
// page and of the form error state, for a human to review.

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const siteDir = path.resolve(process.argv[2] || repo);
const outDir = path.resolve(process.argv[3] || path.join(repo, 'a11y-audit', 'after'));
fs.mkdirSync(outDir, { recursive: true });

const pages = ['/', '/accessibility.html'].filter(p => fs.existsSync(path.join(siteDir, p === '/' ? 'index.html' : p)));
const themes = ['light', 'dark'];
const { base, close } = await serve(siteDir);
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const ace = require.resolve('accessibility-checker-engine/ace.js');
const summary = [];

for (const pg of pages) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
    const page = await ctx.newPage();
    await page.goto(base + pg, { waitUntil: 'load' });
    const name = `${pg === '/' ? 'index' : path.basename(pg, '.html')}-${theme}`;

    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    fs.writeFileSync(path.join(outDir, `axe-${name}.json`), JSON.stringify(axe.violations, null, 2));

    await page.addScriptTag({ path: ace });
    const ibm = await page.evaluate(async () => {
      const report = await new window.ace.Checker().check(document, ['IBM_Accessibility']);
      return report.results.filter(r => r.value[1] !== 'PASS').map(r => ({
        rule: r.ruleId, level: r.value[0], result: r.value[1], message: r.message, path: r.path.dom,
      }));
    });
    fs.writeFileSync(path.join(outDir, `ibm-${name}.json`), JSON.stringify(ibm, null, 2));

    summary.push({
      page: pg, theme,
      axeRules: axe.violations.length,
      axeElements: axe.violations.reduce((n, v) => n + v.nodes.length, 0),
      axeIds: axe.violations.map(v => v.id),
      ibmViolations: ibm.filter(r => r.level === 'VIOLATION' && r.result === 'FAIL').length,
      ibmNeedsReview: ibm.filter(r => r.result === 'POTENTIAL').length,
    });
    await ctx.close();
  }
}

// Colour vision deficiency screenshots (Chromium only)
const shotsDir = path.join(outDir, 'vision');
fs.mkdirSync(shotsDir, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(base + '/', { waitUntil: 'load' });
const hasForm = await page.locator('#apply-form').count();
for (const type of ['none', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia', 'blurredVision']) {
  await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: path.join(shotsDir, `${type}-top.jpg`), type: 'jpeg', quality: 80 });
  if (hasForm) {
    if (type === 'none') {
      await page.click('#apply-form button[type="submit"]');
      await page.fill('#email', 'kene');
    }
    await page.locator('#apply').screenshot({ path: path.join(shotsDir, `${type}-form-errors.jpg`), type: 'jpeg', quality: 80 });
  }
}
await ctx.close();

// Dark mode and forced colours screenshots for review
for (const [label, opts] of [['dark', { colorScheme: 'dark' }], ['forced-colors', { forcedColors: 'active' }], ['more-contrast', { contrast: 'more' }]]) {
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', ...opts });
  const p = await c.newPage();
  await p.goto(base + '/', { waitUntil: 'load' });
  await p.screenshot({ path: path.join(shotsDir, `${label}-top.jpg`), type: 'jpeg', quality: 80 });
  if (hasForm) {
    await p.click('#apply-form button[type="submit"]');
    await p.locator('#apply').screenshot({ path: path.join(shotsDir, `${label}-form-errors.jpg`), type: 'jpeg', quality: 80 });
  }
  await c.close();
}

await browser.close();
close();

fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`\nAudit of ${siteDir}`);
console.log('page                 theme  axe rules  axe elements  IBM violations  IBM needs review');
for (const s of summary) {
  console.log(`${s.page.padEnd(20)} ${s.theme.padEnd(6)} ${String(s.axeRules).padStart(9)} ${String(s.axeElements).padStart(13)} ${String(s.ibmViolations).padStart(15)} ${String(s.ibmNeedsReview).padStart(17)}`);
}
console.log(`\nRaw results and screenshots: ${outDir}`);
