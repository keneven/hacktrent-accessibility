# HackTrent Accessible Website Challenge

The starter site with an accessibility fix pass targeting **WCAG 2.2 AA**. It keeps the original purple and aqua HackTrent look, and adds deeper support for blind, low-vision and colour-blind users.

- **[a11y-audit/AUDIT.md](a11y-audit/AUDIT.md):** the audit. Every issue in the starter with severity, file and line, who it affects and the fix; before/after results; what still needs a human.
- **[ACCESSIBILITY.md](ACCESSIBILITY.md):** every change grouped by judging category, with WCAG criteria.
- **[accessibility.html](accessibility.html):** the public accessibility statement, with known gaps and how to report a problem.

## Results: before vs after

| Check | Starter site | Our site |
|---|---|---|
| Lighthouse Accessibility | 83 | **100** (both pages) |
| Lighthouse Best Practices / SEO | 92 / 82 | **100 / 100** |
| axe-core, WCAG A/AA + best practice | 5 rules, 25 elements | **0**, in light and dark mode |
| IBM Equal Access Checker violations | 29 | **0**, in light and dark mode |
| HTML validation errors (html-validate) | 14 | **0** |
| Elements reachable by keyboard | 6 (nav was mouse-only) | **22 of 22** |
| Focus indicator | 1px browser default, invisible on purple | **3px, 8:1 to 17:1 contrast** |
| Worst text contrast | 1.10:1 | **6.05:1** light, **7.88:1** dark |
| Page width at 320px (400% zoom) | 940px, scrolls sideways | **320px, no sideways scroll** |
| Dark mode / increased contrast / Windows contrast themes | none | **all three** |
| Image weight | 6.7 MB | **184 KB** |
| Automated behaviour tests | none | **34 / 34 pass** |

Before/after screenshots are in [`a11y-audit/screenshots/`](a11y-audit/screenshots/). Colour-blindness, dark mode and contrast-mode screenshots are in [`a11y-audit/after/vision/`](a11y-audit/after/vision/).

## Run the checks

```bash
npm install
npx playwright install chromium      # or: export CHROME_PATH=/path/to/chrome
npm run check                        # HTML validation + 34 accessibility tests
npm run audit                        # raw axe + IBM results and vision screenshots -> a11y-audit/after/
```

`tests/a11y.test.mjs` checks:

- **Scanners:** axe-core and the IBM Equal Access engine (the two tools from the workshop) on both pages, in light, dark and increased-contrast modes; console errors; 320px reflow
- **Keyboard:** skip link first and working; every control reachable with a 3px+ focus ring that is never covered; Enter activates nav; no positive tabindex
- **Search:** linked error on empty search; result count announced from a live region present since page load; Escape clears
- **Form:** focused error summary listing all 5 problems; `aria-invalid` and `aria-describedby` (hints kept); summary links focus fields; specific email errors that clear live; success announced
- **Low vision:** 24px minimum targets, 200% text, WCAG 1.4.12 text spacing at 1280px and 320px, reduced motion, forced colours

## Still needs a human (do before demoing)

Automated tools catch only part of the real issues. These still need a person:

- [ ] **Keyboard only:** put the mouse away and do search and the apply form with Tab, Shift+Tab, Enter, Space and arrow keys
- [ ] **Screen reader:** VoiceOver (Mac, Cmd+F5) or NVDA (Windows, free). List headings and landmarks, submit the form with mistakes, check the search count is read
- [ ] **Magnifier at 4x** while filling in the form
- [ ] **Alt text review** by someone who knows the photos
- [ ] **Windows contrast theme** on a real Windows machine

## Files

| File | What it is |
|---|---|
| `index.html` | The page: landmarks, headings, skip link, real links, labelled forms |
| `styles.css` | Contrast-checked tokens for light, dark and high contrast; focus styles; responsive grid; reduced motion; forced colours |
| `script.js` | Search with announced results; apply form validation with error summary |
| `accessibility.html` | Accessibility statement |
| `tests/` | `a11y.test.mjs` (pass/fail suite), `audit.mjs` (raw results + screenshots), `serve.mjs` |
| `a11y-audit/` | `AUDIT.md`, raw before/after results, Lighthouse reports, screenshots |
| `assets/` | Resized images (GPS data stripped) and the Atkinson Hyperlegible Next font (SIL OFL) |
