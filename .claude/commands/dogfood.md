---
description: Systematic exploratory QA testing of a web application
allowed-tools: [Read, Write, Bash]
argument-hint: "[url] [scope]"
---

# Dogfood: Systematic Web QA

Perform systematic exploratory QA testing with browser tools. Target: **$1** with scope: **$2** (or full-site if not specified).

## Phase 1: Plan
1. Create output directory: `./dogfood-output/screenshots/`
2. Build a sitemap of pages to test:
   - Landing/home page
   - Navigation (header, footer, sidebar)
   - Key user flows (sign up, login, search, etc.)
   - Forms and interactive elements
   - Edge cases (empty states, error pages, 404s)

## Phase 2: Explore
For each page/feature:

1. **Navigate** → `browser_navigate(url=...)`
2. **Snapshot DOM** → `browser_snapshot()`
3. **Check console** → `browser_console()` — do this after every navigation and interaction
4. **Visual assessment** → `browser_vision(annotate=true)` — numbered `[N]` labels for elements
5. **Interact systematically**:
   - Click buttons/links: `browser_click(ref="@eN")`
   - Fill forms: `browser_type(ref="@eN", text="...")`
   - Test with valid AND invalid inputs
   - Keyboard: `browser_press(key="Tab")`, `browser_press(key="Enter")`
   - Scroll: `browser_scroll(direction="down")`
6. **After each interaction** → check console and visual changes

## Phase 3: Collect Evidence
For each issue found:
- Screenshot and save path
- Record: URL, steps to reproduce, expected vs actual, console errors
- Classify: severity (Critical/High/Medium/Low) + category (Functional/Visual/Accessibility/Console/UX/Content)

## Phase 4: Categorize
- De-duplicate issues
- Sort by severity (Critical first)
- Count by severity and category

## Phase 5: Report
Generate `dogfood-output/report.md` with:
1. Executive summary (totals, severity breakdown, scope)
2. Per-issue sections: number, title, severity/category, URL, description, repro steps, expected vs actual
3. Summary table
4. Testing notes (what was/wasn't tested, blockers)
