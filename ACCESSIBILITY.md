# What we changed and why

Every fix below is grouped by judging category and tagged with the WCAG 2.2 success criterion it addresses. "Starter" means the original repo.

The formal audit (severity, file and line, who each issue affects, raw tool output, and what still needs a human) is in **[a11y-audit/AUDIT.md](a11y-audit/AUDIT.md)**.

---

## 1. Keyboard navigation and focus (25 pts)

| Starter problem | Our fix | WCAG |
|---|---|---|
| The 5 main nav items were `<div onclick="location.href=...">`. Tab skipped them, Enter did nothing, and screen readers didn't announce them as links. Keyboard users couldn't navigate at all. | Real `<a href>` links in a `<nav aria-label="Main"><ul>`. All 5 are now tab stops and work with Enter. | 2.1.1 Keyboard, 4.1.2 Name, Role, Value |
| No way to skip the header and nav. | "Skip to main content" is the first tab stop. It appears on focus and moves focus to `<main tabindex="-1">`. | 2.4.1 Bypass Blocks |
| Only the browser's 1px default focus ring, which is nearly invisible on the purple backgrounds. | 3px solid outline with a 3px offset on every focusable element. Yellow `#FDE047` on dark areas (8.31:1 and 12.70:1), near-black on light areas (17.5:1). | 2.4.7 Focus Visible, 1.4.11 Non-text Contrast, 2.4.13 Focus Appearance (AAA) |
| N/A | No fixed or sticky overlays cover content, so a focused element is never hidden. Every tab stop is checked automatically. | 2.4.11 Focus Not Obscured |
| Visual order and DOM order didn't match (broken nesting put the sidebar and footer inside the main content). | DOM order now matches reading order: skip link, header, search, nav, main, sidebar, footer. No positive `tabindex` anywhere. | 2.4.3 Focus Order, 1.3.2 Meaningful Sequence |
| N/A | Focus is managed. On a failed submit, focus jumps to the error summary. Each summary link focuses its field, not just scrolls to it. The "Clear search results" button returns focus to the search box. | 2.4.3 Focus Order, 3.3.1 Error Identification |
| N/A | Escape clears the search box and its results. The radio group follows native arrow-key behaviour. | 2.1.1 Keyboard |
| N/A | The desktop nav only sticks when the window is at least 32em tall. On short or zoomed windows it scrolls normally, so it can never cover anything. | 2.4.11 Focus Not Obscured |
| N/A | The same main nav, in the same order, on both pages. | 3.2.3 Consistent Navigation |

## 2. Visual accessibility (20 pts)

| Starter problem | Our fix | WCAG |
|---|---|---|
| Contrast failed nearly everywhere: purple on blueviolet **1.58:1**, blue nav text on purple **1.10:1**, dark blue on black **1.37:1**. axe flagged 16 elements. | New palette that keeps the HackTrent purple and aqua. Every text pair is now between 6.05:1 and 17.5:1. Ratios are commented beside each rule in `styles.css`. | 1.4.3 Contrast (Minimum) |
| Search box and button borders were barely visible. | 2px dark borders (17.5:1). The aqua button sits at 7.56:1 against the header. | 1.4.11 Non-text Contrast |
| Fixed `220px 1fr 220px` grid. At 320px wide (the same as 400% zoom) the page was 940px wide and scrolled sideways. | Mobile-first grid: one column below 64em, the original three columns above it. No sideways scroll at 320px. | 1.4.10 Reflow |
| The tagline (h3, 2.1em) was bigger than the site name (h2, 2em). | Clear size hierarchy using `rem` and `clamp()`, so browser text size settings and zoom work. Tested at 200% text size. | 1.4.4 Resize Text |
| Errors and links could rely on colour alone. | Links are always underlined. Errors use an icon, the text "Error:", a thick border and a side bar, not just red. | 1.4.1 Use of Color |
| Long paragraphs were centred, in default Times, at full width. | Left-aligned text, 1.5 line height, max line length of 70 characters. Text spacing stays readable with the WCAG 1.4.12 overrides applied (tested at 1280px and 320px). | 1.4.8 Visual Presentation (AAA), 1.4.12 Text Spacing |
| The default font makes I, l and 1 look alike. | **Atkinson Hyperlegible Next**, designed by the Braille Institute for low-vision readers, self-hosted (34 KB, SIL Open Font License). Body text is 17px at default settings. | 1.4.8 (AAA) |
| No dark mode. | Full dark theme that follows the system setting. Every pair is re-measured: body text 15.34:1, nothing below 7.88:1, no pure white on pure black. Native controls switch too (`color-scheme`). | 1.4.3, 1.4.11 |
| N/A | The "Increase contrast" system setting (`prefers-contrast: more`) turns grey text full-strength and makes borders darker and thicker. | 1.4.3, 1.4.11 |
| N/A | Colour-blindness check: screenshots simulating deuteranopia, protanopia, tritanopia, full colour blindness and blurred vision, reviewed by eye (`a11y-audit/after/vision/`). Errors and links stay clear in all of them. | 1.4.1 Use of Color |
| Small click targets. | Nav links, buttons and inputs are 44px tall. Radios and checkboxes are 24px with padded labels, so the whole label is clickable. | 2.5.8 Target Size (Minimum) |
| N/A | Smooth scrolling only runs when the user hasn't asked for reduced motion, and a global reduced-motion rule switches off any animation added later. | 2.3.3 Animation from Interactions (AAA) |
| N/A | Windows High Contrast (`forced-colors`) support: the focus ring uses the system Highlight colour and buttons keep visible borders. | 1.4.11 Non-text Contrast |
| Images were 6.7 MB, painful on slow mobile data. | Resized to 184 KB total, with `width` and `height` set so the layout doesn't jump while they load. Also stripped GPS location data from the group photo. | Performance and privacy |

## 3. Semantic HTML and screen readers (20 pts)

| Starter problem | Our fix | WCAG |
|---|---|---|
| No `<!DOCTYPE html>`, so the page rendered in quirks mode. | Added. | 4.1.1 (parsing) |
| Broken nesting: the `.content` section and its `<div>` were never closed, so the sidebar and footer were nested inside the main content. 14 HTML validation errors. | Valid, properly nested HTML. 0 errors in html-validate. | 1.3.1 Info and Relationships |
| Everything was `<section>` and `<div>`, with no landmarks. | `<header>`, native `<search>`, `<nav aria-label="Main">`, `<main>`, `<aside aria-labelledby>` "Latest News", `<footer>` with `<nav aria-label="Footer">`. The apply form is named by its heading, so it shows up as an "Apply Now" form landmark. Screen reader users can jump between them. | 1.3.1, 2.4.1 |
| No `<h1>`. Headings were chosen for size (h2, h3, h4). "@ Trent University" was a heading wrapped in `<i>`. | One `<h1>` "Welcome to HackTrent", an `<h2>` for each section, `<h3>` inside sections. The tagline is a `<p>`. | 1.3.1, 2.4.6 Headings and Labels, 2.4.10 Section Headings |
| Both images had no `alt`. | Descriptive alt text for both photos. | 1.1.1 Non-text Content |
| `width="500px"` (invalid attribute value). | Numeric `width` and `height`, with sizing done in CSS. | Valid HTML |
| The page title "Accessbility Challenge" was misspelled and described nothing. | "HackTrent at Trent University". The statement page has its own title. | 2.4.2 Page Titled |
| "this is the right content" relied on visual position. | A real heading: "Latest News". | 1.3.3 Sensory Characteristics |
| A quote shown with plain quotation marks in a `<p>`. | `<blockquote>`. | 1.3.1 |
| Footer links were separated by "\|" characters, which screen readers read as "vertical bar". | A list inside a labelled footer `<nav>`. Visual spacing comes from CSS. | 1.3.1 |
| N/A | The schedule uses real `<table>` markup with `<caption>`, `<th scope="col">` and `<th scope="row">`, plus `<time datetime>`. | 1.3.1 |
| N/A | Status messages are announced without moving focus: the search result count and form success use `role="status"`. | 4.1.3 Status Messages |
| N/A | ARIA kept to the minimum: native elements first (`<search>`, `<nav>`, `<button>`, `<fieldset>`), ARIA only for things HTML can't do (`aria-invalid`, `aria-describedby`, `aria-current`, landmark names). | 4.1.2 |
| Lorem ipsum placeholder is pseudo-Latin, which screen readers read with English pronunciation. | Marked `lang="la"`. | 3.1.2 Language of Parts |
| CSS was linked with absolute paths (`/styles.css`), so opening the file directly or hosting in a GitHub Pages subfolder loaded no styles at all. | Relative paths. | Robustness |
| A favicon 404 showed up as a console error. | Empty inline icon. 0 console errors. | Best practice |

## 4. Forms and interaction (15 pts)

**Search (was in the starter)**

| Starter problem | Our fix | WCAG |
|---|---|---|
| `<b>Search:</b>` was not connected to the input, so the placeholder was the only label. | `<label for="search-input">` "Search this site", always visible. | 1.3.1, 3.3.2 Labels or Instructions, 4.1.2 |
| `type="url"` brought up the wrong mobile keyboard and expects a web address. | `type="search"`, so screen readers announce it as a search box. | 4.1.2 |
| No `<form>` and no search landmark. The button said only "Go" and had no `type`. | `<form role="search">` with `<button type="submit">Search</button>`. | 2.4.6, 4.1.2 |
| The search did nothing. | It now lists matching sections as links, directly under the search box where magnifier users are looking. "2 results for ..." is announced through a `role="status"` region that is in the page from the start (a live region added at the moment of the update is often not read). An empty search shows an error linked with `aria-describedby` and `aria-invalid`. | 3.3.1, 4.1.3 |

**Apply form (added: the "Apply Now" nav link pointed at `#apply`, which didn't exist)**

- Every control has a visible `<label>`. Hints are linked with `aria-describedby`.
- Every label says "(required)" or "(optional)" in text, never a red asterisk. 3.3.2
- `autocomplete="name"` and `autocomplete="email"`, with `type="email"`. 1.3.5 Identify Input Purpose
- The radio buttons are grouped in `<fieldset>` and `<legend>`. 1.3.1
- On submit with errors:
  - an error summary gets focus, with a title like "There are 5 problems with your application"
  - each item links to and focuses its field
  - each field gets `aria-invalid="true"` and an inline message
  - each message starts with screen-reader-only text "Error:" and is added to `aria-describedby` without removing the hint. 3.3.1 Error Identification
- Messages say how to fix the problem, for example "Enter an email address in the format name@example.com", not just "invalid". 3.3.3 Error Suggestion
- After the first submit, each error clears as soon as the field is fixed. Entered values are never wiped on error.
- Success is announced through `role="status"`. 4.1.3
- Progressive enhancement: without JavaScript, the browser's own `required` validation still works.

## 5. Testing and technical quality (20 pts)

**Tools.** Both extensions recommended in the workshop deck (axe and the IBM Equal Access Checker) were run as engines in a script, alongside Lighthouse and html-validate.

- `npm test` (34 checks) covers what the scanners can't see: focus order, focus visibility, focus management, live announcements, error handling, reduced motion, forced colours, 200% text and WCAG 1.4.12 text spacing. axe and IBM run in light, dark and increased-contrast modes.
- `npm run audit` saves the raw axe and IBM results for each page and theme, plus colour-blindness screenshots, to `a11y-audit/after/`. The same script was run on the untouched starter to produce `a11y-audit/before/`.

**Results:** see [a11y-audit/AUDIT.md](a11y-audit/AUDIT.md). In short: Lighthouse 83 to 100, axe 25 failing elements to 0, IBM 29 violations to 0, HTML 14 errors to 0, keyboard-reachable controls 6 to 22.

**Bugs our checks caught during the build** are listed in section 3 of [AUDIT.md](a11y-audit/AUDIT.md).

**Content notes:**
- The schedule times are placeholders. Swap in the real ones.
- The Privacy, Terms and Recap links still point to placeholder anchors, as in the starter.
- Consistent help (WCAG 3.2.6): a Contact link sits in the same footer position on both pages, and the accessibility statement says how to report a problem.
