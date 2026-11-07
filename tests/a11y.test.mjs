// HackTrent accessibility test suite
// Run with:  npm install  &&  npx playwright install chromium  &&  npm test
// (or set CHROME_PATH to an installed Chrome and skip the playwright install)
//
// Starts a local server, then checks:
//   1. axe-core (WCAG 2.2 A/AA + best practices) and the IBM Equal Access engine,
//      on both pages, in light mode, dark mode and "increase contrast" mode
//   2. Keyboard: skip link, tab order, visible focus, focus never hidden, Enter activates nav
//   3. Search: empty-search error, results announced from an always-present live region, Escape clears
//   4. Apply form: error summary, inline errors, aria-invalid, aria-describedby, focus, success
//   5. Low vision: 320px reflow, 200% text, WCAG 1.4.12 text spacing, target sizes
//   6. Reduced motion, forced colours, console errors

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serve } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const server = await serve(root);
const base = server.base;

// ---------- tiny test runner ----------
let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log(`  PASS  ${name}`); }
  catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
async function open(url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + url, { waitUntil: 'load' });
  return { page, ctx, errors };
}
const active = page => page.evaluate(() => {
  const el = document.activeElement;
  return { id: el.id, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 60) };
});

const modes = {
  light: { colorScheme: 'light' },
  dark: { colorScheme: 'dark' },
  'more contrast': { contrast: 'more' },
};

for (const url of ['/', '/accessibility.html']) {
  console.log(`\nAutomated scans: ${url}`);

  for (const [mode, opts] of Object.entries(modes)) {
    await test(`axe-core finds 0 WCAG 2.2 AA / best-practice violations (${mode})`, async () => {
      const { page, ctx } = await open(url, opts);
      const r = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
      await ctx.close();
      assert(r.violations.length === 0, r.violations.map(v => `${v.id} (${v.nodes.length})`).join(', '));
    });
  }

  for (const mode of ['light', 'dark']) await test(`IBM Equal Access Checker finds 0 violations (${mode})`, async () => {
    const { page, ctx } = await open(url, modes[mode]);
    await page.addScriptTag({ path: require.resolve('accessibility-checker-engine/ace.js') });
    const fails = await page.evaluate(async () => {
      const report = await new window.ace.Checker().check(document, ['IBM_Accessibility']);
      return report.results.filter(r => r.value[0] === 'VIOLATION' && r.value[1] === 'FAIL').map(r => r.ruleId);
    });
    await ctx.close();
    assert(fails.length === 0, fails.join(', '));
  });

  await test('no console errors (no 404s, no script errors)', async () => {
    const { ctx, errors } = await open(url);
    await ctx.close();
    assert(errors.length === 0, errors.join(' | '));
  });

  await test('reflows at 320px with no horizontal scrolling (WCAG 1.4.10)', async () => {
    const { page, ctx } = await open(url, { viewport: { width: 320, height: 640 } });
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    await ctx.close();
    assert(w <= 320, `page is ${w}px wide at a 320px viewport`);
  });
}

console.log('\nKeyboard navigation and focus');

await test('first Tab lands on a visible "Skip to main content" link', async () => {
  const { page, ctx } = await open('/');
  await page.keyboard.press('Tab');
  const a = await active(page);
  const box = await page.locator('.skip-link').boundingBox();
  await ctx.close();
  assert(a.text === 'Skip to main content', `first focus was "${a.text}"`);
  assert(box && box.y >= 0, 'skip link is off screen when focused');
});

await test('skip link moves focus to <main>', async () => {
  const { page, ctx } = await open('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const a = await active(page);
  await ctx.close();
  assert(a.id === 'main', `focus went to ${a.tag}#${a.id}`);
});

await test('every interactive element is reachable by Tab, has a 3px+ focus ring, and is not hidden', async () => {
  const { page, ctx } = await open('/');
  // A radio group is one tab stop, so count groups rather than buttons
  const expected = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a[href], button, input, select, textarea')].filter(el => !el.closest('[hidden]'));
    const radioGroups = new Set(els.filter(el => el.type === 'radio').map(el => el.name));
    return els.filter(el => el.type !== 'radio').length + radioGroups.size;
  });
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    // Smooth scrolling animates focus into view, so wait until the page stops moving
    await page.evaluate(() => new Promise(done => {
      let last = -1, still = 0;
      const tick = () => { if (scrollY === last && ++still >= 3) return done(); if (scrollY !== last) still = 0; last = scrollY; setTimeout(tick, 60); };
      tick();
    }));
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      const top = document.elementFromPoint(cx, cy);
      return {
        key: [...document.querySelectorAll('*')].indexOf(el),
        label: el.id || el.textContent.trim() || el.name,
        ring: cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) : 0,
        visible: r.bottom > 0 && r.top < innerHeight && (top === el || el.contains(top) || (top && top.control === el) || (el.labels && [...el.labels].some(l => l.contains(top)))),
      };
    });
    if (!info || seen.has(info.key)) break;
    seen.add(info.key);
    assert(info.ring >= 3, `"${info.label}" has a ${info.ring}px focus ring`);
    assert(info.visible, `"${info.label}" is hidden or covered when focused (WCAG 2.4.11)`);
  }
  await ctx.close();
  assert(seen.size === expected, `${seen.size} tab stops reached, expected ${expected}`);
});

await test('Enter on a nav link jumps to its section', async () => {
  const { page, ctx } = await open('/');
  await page.locator('.site-nav a', { hasText: 'Apply Now' }).focus();
  await page.keyboard.press('Enter');
  const hash = await page.evaluate(() => location.hash);
  await ctx.close();
  assert(hash === '#apply', `hash is ${hash}`);
});

await test('no positive tabindex values', async () => {
  const { page, ctx } = await open('/');
  const n = await page.locator('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])').count();
  await ctx.close();
  assert(n === 0, `${n} element(s) with positive tabindex`);
});

console.log('\nSearch');

await test('empty search shows a linked error and keeps focus in the box', async () => {
  const { page, ctx } = await open('/');
  await page.locator('#search-input').focus();
  await page.keyboard.press('Enter');
  const s = await page.evaluate(() => {
    const i = document.getElementById('search-input');
    return { invalid: i.getAttribute('aria-invalid'), desc: i.getAttribute('aria-describedby'),
      errorShown: !document.getElementById('search-error').hidden, focus: document.activeElement.id };
  });
  await ctx.close();
  assert(s.invalid === 'true' && s.errorShown, 'error not shown / aria-invalid not set');
  assert((s.desc || '').includes('search-error'), 'error not linked with aria-describedby');
  assert(s.focus === 'search-input', 'focus left the search box');
});

await test('search status live region is in the accessibility tree before any search', async () => {
  const { page, ctx } = await open('/');
  const s = await page.evaluate(() => {
    const el = document.getElementById('search-status');
    return { role: el.getAttribute('role'), hiddenAncestor: !!el.closest('[hidden]'), display: getComputedStyle(el).display };
  });
  await ctx.close();
  assert(s.role === 'status' && !s.hiddenAncestor && s.display !== 'none', JSON.stringify(s));
});

await test('search results are announced via role="status" and link to sections', async () => {
  const { page, ctx } = await open('/');
  await page.fill('#search-input', 'schedule');
  await page.keyboard.press('Enter');
  const status = await page.textContent('#search-status');
  const role = await page.getAttribute('#search-status', 'role');
  const links = await page.$$eval('#search-list a', as => as.map(a => a.getAttribute('href')));
  await page.locator('#search-input').focus();
  await page.keyboard.press('Escape');
  const hiddenAfterEsc = await page.locator('#search-results').isHidden();
  await ctx.close();
  assert(role === 'status', 'results count is not in a live region');
  assert(/result/.test(status), `status text was "${status}"`);
  assert(links.includes('#schedule'), `links were ${links}`);
  assert(hiddenAfterEsc, 'Escape did not clear results');
});

console.log('\nForms and interaction');

await test('submitting empty form focuses an error summary listing every problem', async () => {
  const { page, ctx } = await open('/');
  await page.click('#apply-form button[type="submit"]');
  const s = await page.evaluate(() => ({
    focus: document.activeElement.id,
    items: document.querySelectorAll('#error-summary-list a').length,
    title: document.getElementById('error-summary-title').textContent,
  }));
  await ctx.close();
  assert(s.focus === 'error-summary', `focus went to #${s.focus}`);
  assert(s.items === 5, `${s.items} items in summary, expected 5`);
  assert(/5 problems/.test(s.title), `title was "${s.title}"`);
});

await test('invalid fields get aria-invalid and an error linked by aria-describedby (hints kept)', async () => {
  const { page, ctx } = await open('/');
  await page.click('#apply-form button[type="submit"]');
  const s = await page.evaluate(() => {
    const g = id => document.getElementById(id);
    return {
      name: [g('full-name').getAttribute('aria-invalid'), g('full-name').getAttribute('aria-describedby')],
      email: g('email').getAttribute('aria-describedby'),
      radios: [...document.querySelectorAll('[name="experience"]')].every(r => r.getAttribute('aria-invalid') === 'true'),
      group: g('experience-group').getAttribute('aria-describedby'),
      text: g('full-name-error').textContent,
    };
  });
  await ctx.close();
  assert(s.name[0] === 'true' && s.name[1] === 'full-name-error', `name field: ${s.name}`);
  assert(s.email === 'email-hint email-error', `email describedby: ${s.email}`);
  assert(s.radios && s.group === 'experience-error', 'radio group error not linked');
  assert(s.text.startsWith('Error:'), 'error text does not start with "Error:" for screen readers');
});

await test('error summary links move focus to the field', async () => {
  const { page, ctx } = await open('/');
  await page.click('#apply-form button[type="submit"]');
  await page.click('#error-summary-list a >> nth=1');
  const a = await active(page);
  await ctx.close();
  assert(a.id === 'email', `focus went to #${a.id}`);
});

await test('wrong email format gets a specific message; errors clear live once fixed', async () => {
  const { page, ctx } = await open('/');
  await page.click('#apply-form button[type="submit"]');
  await page.fill('#email', 'kene');
  const msg = await page.textContent('#email-error');
  await page.fill('#email', 'kene@trentu.ca');
  const after = await page.evaluate(() => [document.getElementById('email').getAttribute('aria-invalid'), document.getElementById('email-error').hidden]);
  await ctx.close();
  assert(/format/.test(msg), `message was "${msg}"`);
  assert(after[0] === null && after[1] === true, 'error did not clear after fixing');
});

await test('valid submission announces success via role="status"', async () => {
  const { page, ctx } = await open('/');
  await page.fill('#full-name', 'Kene Ven');
  await page.fill('#email', 'kene@trentu.ca');
  await page.selectOption('#year', '3rd year');
  await page.check('#exp-some');
  await page.check('#conduct');
  await page.click('#apply-form button[type="submit"]');
  const s = await page.evaluate(() => ({
    status: document.getElementById('apply-status').textContent,
    role: document.getElementById('apply-status').getAttribute('role'),
    summaryHidden: document.getElementById('error-summary').hidden,
    invalid: document.querySelectorAll('[aria-invalid="true"]').length,
  }));
  await ctx.close();
  assert(s.role === 'status' && s.status.includes('Thanks'), `status: "${s.status}"`);
  assert(s.summaryHidden && s.invalid === 0, 'errors left behind after success');
});

await test('every form control has a programmatic label', async () => {
  const { page, ctx } = await open('/');
  const unlabeled = await page.$$eval('input, select, textarea', els =>
    els.filter(el => !(el.labels && el.labels.length) && !el.getAttribute('aria-label')).map(el => el.id || el.name));
  await ctx.close();
  assert(unlabeled.length === 0, `unlabeled: ${unlabeled}`);
});

await test('controls are at least 24x24px (WCAG 2.5.8)', async () => {
  const { page, ctx } = await open('/');
  const small = await page.$$eval('button, input, select, textarea, nav a, .skip-link', els =>
    els.filter(el => !el.closest('[hidden]')).map(el => {
      const r = el.getBoundingClientRect();
      return { k: el.id || el.textContent.trim(), w: r.width, h: r.height };
    }).filter(b => b.w > 0 && (b.w < 24 || b.h < 24)));
  await ctx.close();
  assert(small.length === 0, JSON.stringify(small));
});

console.log('\nVisual preferences');

await test('smooth scrolling turns off with prefers-reduced-motion', async () => {
  const { page, ctx } = await open('/', { reducedMotion: 'reduce' });
  const sb = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  await ctx.close();
  assert(sb === 'auto', `scroll-behavior is ${sb}`);
});

await test('focus ring survives Windows High Contrast (forced colours)', async () => {
  const { page, ctx } = await open('/', { forcedColors: 'active' });
  await page.locator('.site-nav a >> nth=0').focus();
  await page.keyboard.press('Tab');
  const o = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  await ctx.close();
  assert(o === 'solid', `outline is ${o}`);
});

for (const width of [1280, 320]) await test(`no clipping with WCAG 1.4.12 text spacing at ${width}px`, async () => {
  const { page, ctx } = await open('/', { viewport: { width, height: 900 } });
  await page.addStyleTag({ content: `* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }` });
  const r = await page.evaluate(() => ({
    clipped: [...document.querySelectorAll('body *')].filter(el =>
      !el.closest('.visually-hidden') && ['hidden', 'clip'].includes(getComputedStyle(el).overflowX) &&
      (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)).map(el => el.tagName),
    fits: document.documentElement.scrollWidth <= innerWidth,
  }));
  await ctx.close();
  assert(r.clipped.length === 0 && r.fits, JSON.stringify(r));
});

await test('text stays readable at 200% text size (no clipped content)', async () => {
  const { page, ctx } = await open('/');
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  const clipped = await page.$$eval('h1, h2, h3, p, a, label, button, th, td', els =>
    els.filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow === 'hidden').length);
  const w = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  await ctx.close();
  assert(clipped === 0 && w, `${clipped} clipped element(s), fits width: ${w}`);
});

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
