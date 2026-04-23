# Accessibility Checklist

This project keeps a lightweight WCAG baseline for shared frontend surfaces.

## Local Audit

Run an axe snapshot against the production build:

```bash
pnpm install
pnpm run audit:a11y
```

The script builds the app, serves `dist` locally, scans `/login`, `/`, `/home`, and `/square`, then writes a JSON report under `reports/a11y/`.

Useful overrides:

```bash
A11Y_PAGES=/login,/home pnpm run audit:a11y
A11Y_BASE_URL=http://localhost:3000 pnpm run audit:a11y
A11Y_SKIP_BUILD=1 pnpm run audit:a11y
A11Y_CHROME_PATH=/path/to/chrome pnpm run audit:a11y
```

## Component Rules

- Prefer native `button`, `a`, `input`, and form controls before adding ARIA.
- Icon-only buttons must have an accessible name with `aria-label`.
- Custom clickable wrappers must support both pointer and keyboard activation.
- Visible focus states must remain enabled; do not remove outlines without a replacement.
- Images need useful `alt` text, or `alt=""` when the image is decorative.
- New shared UI components should include an axe smoke test when practical.

## PR Expectations

- Run `pnpm exec max lint` before opening the PR.
- Run the focused axe smoke test when touching shared base/custom/layout UI.
- Include the generated report summary in the PR body if `audit:a11y` finds issues.

## Troubleshooting

If `audit:a11y` fails before producing axe JSON and mentions a missing `chromedriver` binary, allow the `chromedriver` install script with `pnpm approve-builds` in that environment, then reinstall or rebuild dependencies.

If it cannot find a Chrome binary, install Chrome/Chromium or set `A11Y_CHROME_PATH` to the browser executable.
