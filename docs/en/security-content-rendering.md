<!--
Contributor guide for SafeHtml and DOMPurify-backed content rendering.
-->

# Security Content Rendering

## Why This Exists

`SafeHtml` gives non-Markdown render paths one shared sanitization boundary. Use it whenever frontend code needs to render HTML that is not a hardcoded trusted constant.

This helper wraps `dompurify` and applies a conservative default:

- strips `<script>` and event handler attributes
- blocks `javascript:` / `vbscript:` URLs
- blocks `data:` URLs except image MIME types on `src`
- blocks embedded frames and similar high-risk tags by default

Note: `dompurify` already ships its own TypeScript types, so no extra `@types/dompurify` package is required.

## Profiles

### `strict`

Use for short inline HTML such as slogans, labels, modal copy, or admin-configured snippets that only need emphasis and links.

### `markdown-output`

Use for sanitized rich text that may contain paragraphs, lists, headings, images, tables, or links.

### `svg`

Use only for inline SVG fragments that truly need SVG markup. Keep this profile rare and add focused tests for every new tag or attribute you allow.

## Example

```tsx
import SafeHtml from '@/components/base/SafeHtml';

<SafeHtml
  as="div"
  html={content}
  profile="markdown-output"
  allowedTags={['variable']}
  allowedAttributes={['data-key']}
/>;
```

## Choosing A Profile

- Start with `strict`.
- Move to `markdown-output` only when the source genuinely needs block-level rich text.
- Use `allowedTags` / `allowedAttributes` only for narrow, documented exceptions.
- Do not bypass `SafeHtml` for new user-content render paths.

## Requesting A New Profile Or Exception

When extending `SafeHtml`, keep the scope narrow and include:

- the exact call-site that needs the extra markup
- the minimum new tags or attributes required
- regression tests for malicious payloads and the new allowed shape
- a short note in the PR body inventory about why the exception is safe

## Current Non-Goals

This hardening intentionally does not change `src/components/MarkdownRenderer/*`, which maintainers hardened recently. Export utilities and editor-internal DOM helpers should be reviewed separately and only widened when their trust boundary is clear.
