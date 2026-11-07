# Accessibility audit: HackTrent starter site

**Target:** WCAG 2.2 Level AA (ISO/IEC 40500), going beyond AA where it costs little: 3px focus outlines, 44px targets, AAA contrast for body text.
**Scope:** `index.html` (home, search, apply form, schedule) and the new `accessibility.html`.
**Decisions:** this is an accessibility fix pass that keeps the original look. The brand purple and aqua stay, adjusted where needed to pass contrast. The starter had no brand font (it used the browser default, Times), so we use Atkinson Hyperlegible Next.

This audit lists the checks that passed. It is **not** a claim of compliance. See "Needs a human" at the end.

---

## 1. Results: before and after

Raw output for every row is in `before/` and `after/` (axe JSON, IBM JSON, Lighthouse HTML).

| Page | Theme | axe WCAG A/AA (rules / elements) | IBM Equal Access violations | Lighthouse a11y |
|---|---|---|---|---|
| Starter `index.html` | light | 2 / 18 | 29 | 83 |
| Starter `index.html` | dark | 2 / 18 (no dark theme) | 29 | n/a |
| New `index.html` | light | **0 / 0** | **0** | **100** |
| New `index.html` | dark | **0 / 0** | **0** | n/a |
| New `accessibility.html` | light | **0 / 0** | **0** | **100** |
| New `accessibility.html` | dark | **0 / 0** | **0** | n/a |

With axe's best-practice rules added, the starter had 5 rules / 25 elements and the new pages have 0.

| Other checks | Starter | New |
|---|---|---|
| html-validate errors | 14 | 0 |
| Keyboard tab stops reachable | 6 (all 5 nav items mouse-only) | 22 of 22 |
| Width at 320px viewport | 940px (sideways scroll) | 320px |
| Automated behaviour tests (`npm test`) | none | 34 / 34 pass |
| Image weight | 6.7 MB | 184 KB (+34 KB font) |

---

## 2. Issues found in the starter

Severity: **Blocker** = someone cannot complete a task. **Serious** = major difficulty. **Moderate**. **Minor**.
File and line numbers refer to the original starter files.

| # | Issue | WCAG | Severity | Where | Who it affects | Fix | Status |
|---|---|---|---|---|---|---|---|
| 1 | Main nav built from `<div onclick>`: not focusable, no Enter key, not announced as links | 2.1.1, 4.1.2 | **Blocker** | index.html:24-28 | Keyboard, screen reader, switch and voice control users | Real `<a href>` links in `<nav aria-label="Main"><ul>` | Fixed |
| 2 | Text contrast between 1.10:1 and 1.58:1 (purple on blueviolet, blue on purple, dark blue on black) | 1.4.3 | **Blocker** | styles.css:20-24, 27-32, 35-44, 66-76, 130-133 | Low vision, colour blind, older users, anyone in bright light | Contrast-checked tokens: text 6.05:1 to 17.5:1 in light mode, 7.88:1 to 15.34:1 in dark | Fixed |
| 3 | Both images missing `alt` | 1.1.1 | Serious | index.html:34, 56-58 | Blind screen reader users | Descriptive alt text (see "Needs a human") | Fixed |
| 4 | Search input labelled only by placeholder; "Search:" in `<b>` not tied to it | 1.3.1, 3.3.2, 4.1.2 | Serious | index.html:19 | Screen reader, voice control, low vision (the placeholder disappears when typing), cognitive | Visible `<label for>` | Fixed |
| 5 | No landmarks: everything is `<section>` and `<div>` | 1.3.1, 2.4.1 | Serious | index.html:14-71 | Screen reader users | header, nav x2 (named), main, aside (named), footer, native `<search>` | Fixed |
| 6 | No `<h1>`; headings chosen by size (h2, h3, h4); the tagline is a heading in `<i>` | 1.3.1, 2.4.6 | Serious | index.html:16-17, 33 | Screen reader users (most navigate by headings first) | One h1, h2 per section, h3 inside; tagline is `<p>` | Fixed |
| 7 | Broken nesting: `.content` section and div never closed; sidebar and footer nested inside main content | 1.3.1, 1.3.2 | Serious | index.html:31-32, 51, 67 | Screen reader reading order, layout for everyone | Valid nesting, DOM order = visual order | Fixed |
| 8 | Fixed `220px 1fr 220px` grid: 940px wide at a 320px viewport | 1.4.10 | Serious | styles.css:1-6 | Low vision users who zoom, phone users | Mobile-first single column, three columns from 64em | Fixed |
| 9 | Focus indicator is the 1px browser default, invisible on dark purple | 2.4.7, 1.4.11 | Serious | styles.css (no focus styles) | Keyboard users | 3px outline, 3px offset; yellow on dark areas (8.31:1+), ink on light (17.5:1) | Fixed |
| 10 | No skip link | 2.4.1 | Moderate | index.html:11 | Keyboard and screen reader users | Skip link as first tab stop, moves focus to `<main>` | Fixed |
| 11 | Search input 22px tall, nav items 18px tall | 2.5.8 | Moderate | styles.css:54-57, index.html:24-28 | Motor impairments, touch users | 44px targets; 24px radios and checkboxes with padded labels | Fixed |
| 12 | Search `type="url"`; button says only "Go", has no `type`, and does nothing | 4.1.2, 2.4.6 | Moderate | index.html:19 | Screen reader, mobile keyboard users | `type="search"`, "Search" button, working results announced via `role="status"` | Fixed |
| 13 | Missing `<!DOCTYPE html>` (quirks mode) | 4.1.1 | Moderate | index.html:1 | Everyone (inconsistent rendering) | Added | Fixed |
| 14 | CSS linked with absolute paths: no styles at all when opened from disk or a subfolder | Robustness | Moderate | index.html:7-8 | Everyone | Relative paths | Fixed |
| 15 | Title misspelled and not descriptive ("Accessbility Challenge") | 2.4.2 | Moderate | index.html:6 | Screen reader users, anyone with many tabs open | "HackTrent at Trent University"; statement page "Accessibility statement - HackTrent at Trent University" | Fixed |
| 16 | In-page links point at sections that don't exist (#home, #about, #apply, #schedule, #contact) | 2.4.4 | Moderate | index.html:24-28 | Everyone | Sections added for each nav item | Fixed |
| 17 | Long paragraphs centred, default serif font, no line-length limit | 1.4.8 (AAA), 1.4.12 | Moderate | styles.css:74 | Dyslexia, low vision, cognitive | Left-aligned, Atkinson Hyperlegible Next, 1.5 line height, 70ch max | Fixed |
| 18 | 6.7 MB of images; GPS location in the group photo's metadata | Performance, privacy | Moderate | assets/ | People on slow or metered data; the people in the photo | Resized to 184 KB, metadata stripped | Fixed |
| 19 | No dark mode, forced colours or reduced motion support | 1.4.3, 1.4.11, 2.3.3 | Moderate | styles.css | Light-sensitive, low vision, Windows contrast theme users, vestibular disorders | All three added, plus `prefers-contrast: more` | Fixed |
| 20 | "this is the right content": refers to visual position (and it is not on the right on phones) | 1.3.3 | Minor | index.html:52 | Screen reader users, reflow users | Heading "Latest News" | Fixed |
| 21 | Footer links separated by "\|", read aloud as "vertical bar" | 1.3.1 | Minor | index.html:69-70 | Screen reader users | List inside a named footer `<nav>` | Fixed |
| 22 | Quote shown as `<p>` with quotation marks | 1.3.1 | Minor | index.html:41-48 | Screen reader users | `<blockquote>` | Fixed |
| 23 | Invalid `width="500px"` and `width="100px"`; `<br>` used for spacing | Valid HTML | Minor | index.html:34, 40, 58 | Everyone (layout shift) | Numeric width and height, CSS spacing | Fixed |
| 24 | Tagline (2.1em) bigger than the site name (2em) | 1.3.1 (visual hierarchy) | Minor | styles.css:20-32 | Low vision, cognitive | Clear rem-based size scale | Fixed |
| 25 | Placeholder lorem ipsum read with English pronunciation | 3.1.2 | Minor | index.html:35-48 | Screen reader users | Marked `lang="la"` | Fixed |
| 26 | Favicon 404 console error | Best practice | Minor | index.html head | n/a | Empty inline icon | Fixed |
| 27 | Recap, Privacy and Terms links go nowhere | 2.4.4 | Minor | index.html:59, 69-70 | Everyone | Needs real pages from the organizers | **Open** |

---

## 3. Bugs our own checks caught during the build

| Bug | Caught by | Fix |
|---|---|---|
| Skip link slid in over 150ms, so it was off screen for a moment after focus | Keyboard test | Appears instantly |
| Skip link sat outside any landmark | IBM checker | Moved inside `<header>`, still the first tab stop |
| Search result count was a live region inside a hidden container, so screen readers might not announce it | Manual review against the redesign guide | Live region is always in the page |
| Two unnamed `<form>` elements after switching to the native `<search>` element | IBM checker | Apply form named by its "Apply Now" heading |
| Search results appeared full-width below the header, away from the search box | Manual review (magnifier users would miss them) | Results now sit directly under the search box |

---

## 4. IBM "needs review" items (manual triage)

The IBM checker flags these for a human. Each one was checked:

| IBM rule | Count | Verdict |
|---|---|---|
| style_focus_visible | 19 | OK. Every tab stop is checked by `npm test` for a 3px+ outline that is not covered |
| input_fields_grouped | 4 | OK. Radios are in a fieldset; separate text fields don't need grouping |
| input_label_visible | 2 | OK. The select and textarea have visible labels, with a hint between label and field |
| style_color_misuse | 1 | OK. Links are underlined; errors use icon + text + border; checked in greyscale screenshots |
| style_viewport_resizable | 1 | OK. `clamp()` sizes include a rem part; 200% text test passes |
| element_tabbable_visible | 1 | OK. The skip link is hidden until focused, then fully visible (tested) |
| text_block_heading | 1 | OK. "at Trent University" is a tagline, not a heading |
| blockquote_cite_exists | 1 | OK. Placeholder quote has no source to cite |

---

## 5. Definition of Done (redesign guide, section 14)

- [x] Zero axe violations for WCAG 2.0/2.1/2.2 A and AA tags, in light and dark mode
- [x] `lang` set; unique `<title>`; one `<h1>`; ordered headings; landmarks; skip link works
- [x] All text meets 4.5:1 (body text 15:1+); borders, focus outlines and controls meet 3:1, in light and dark mode (dark radio/checkbox outlines measured at 5.04:1)
- [x] No information shown by colour alone; checked in deuteranopia, protanopia, tritanopia, achromatopsia and blurred-vision screenshots (`after/vision/`)
- [x] Links in body text underlined
- [x] Every image has a text alternative (quality still needs human review)
- [x] Every form field has a visible, connected label; errors are linked, announced and descriptive
- [x] Fully keyboard operable; visible focus that is never obscured; no traps
- [x] Targets at least 24x24px (most are 44px); no drag actions
- [x] Works at 200% text and 320px wide; zoom not disabled
- [x] Survives WCAG 1.4.12 text spacing without clipping (tested at 1280px and 320px)
- [x] No hover/focus pop-ups to manage
- [x] Works in forced-colours mode; respects reduced motion and increased contrast
- [x] Dynamic updates announced (`role="status"` regions present from page load); no dialogs
- [x] No CAPTCHA, overlay, autoplay or flashing content
- [x] This file updated with fixes, remaining issues and manual tests still needed

---

## 6. Remaining issues

| Issue | Severity | Why it's open |
|---|---|---|
| Recap, Privacy and Terms links are placeholders | Minor | Needs real pages from the organizers |
| Body copy is lorem ipsum | Moderate | Plain-language rules (guide section 11) can't apply until real content exists |
| Schedule times are placeholders | Minor | Need the real HackTrent schedule |
| Search only covers the home page; the statement page has no search box | Minor | Would need a site index; out of scope for a two-page site |
| Safari may not announce the one-item news list as a list (`list-style: none` without `role="list"`) | Minor | We followed the guide's rule against ARIA that duplicates native semantics |
| Test dependencies added (Playwright, axe, IBM engine, html-validate) | n/a | Dev-only, nothing ships to users. Lighthouse was run separately and is not a project dependency |

---

## 7. Needs a human

1. **Alt text review.** Both photos show real people, so a person who knows the context should check the alt text. The descriptions were written by looking at the images and only describe what is visible.
2. **Keyboard-only walkthrough** of search and the apply form.
3. **Screen reader pass** with NVDA (Windows, free) or VoiceOver (Mac: Cmd+F5). List headings and landmarks, fill in the form with mistakes, and confirm the search count is read out.
4. **OS magnifier at 4x** while filling in the form.
5. **Windows contrast theme on real hardware** (we only emulated forced colours).
6. **Testing with disabled users**, including blind, low-vision and colour-blind people. Pay participants.

**Brand decisions made:** purple and aqua kept but used only on the header, nav, footer, buttons and accents, with darker or lighter shades where needed to pass. The starter's black main panel was replaced with a white (light) or near-black (dark) reading area.
