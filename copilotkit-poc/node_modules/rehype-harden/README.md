# rehype-harden

A rehype plugin that ensures that untrusted markdown does not contain images from and links to unexpected origins.

This is particularly important for markdown returned from [LLMs in AI agents which might have been subject to prompt
injection](https://vercel.com/blog/building-secure-ai-agents).

## Secure prefixes

This package validates URL prefixes and URL origins. Prefix allow-lists can be circumvented
with open redirects, so make sure to make the prefixes are specific enough to avoid such attacks.

E.g. it is more secure to allow `https://example.com/images/` than it is to allow all of
`https://example.com/` which may contain open redirects.

Additionally, URLs may contain path traversal like `/../`. This package does not resolve these.
It is your responsibility that your web server does not allow such traversal.

## Features

- 🔒 **URL Filtering**: Blocks links and images that don't match allowed URL prefixes
- 🔧 **Drop-in**: Works with any rehype-compatible pipeline

## Installation

```bash
npm install rehype-harden
# or
yarn add rehype-harden
# or
pnpm add rehype-harden
```

## Quick Start

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remarkRehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedLinkPrefixes: ["https://github.com/", "https://docs."],
    allowedImagePrefixes: ["https://via.placeholder.com", "/"],
  })
  .use(/* whatever compiler you want, eg hast-to-jsx-runtime or hast-to-svelte */);
```

## API

### Args

#### `defaultOrigin?: string`

- The origin to resolve relative URLs against
- Required when `allowedLinkPrefixes` or `allowedImagePrefixes` are provided (except when using wildcard `["*"]`)
- When using wildcard `["*"]` without `defaultOrigin`, relative URLs (e.g., `/path`, `./page`) are allowed and preserved as-is
- Example: `"https://mysite.com"`

#### `allowedLinkPrefixes?: string[]`

- Array of URL prefixes that are allowed for links
- Links not matching these prefixes will be blocked and shown as `[blocked]`
- Use `"*"` to allow all URLs (disables filtering. However, `javascript:` and `data:` URLs are always disallowed)
- Default: `[]` (blocks all links)
- Example: `['https://github.com/', 'https://docs.example.com/']` or `['*']`

#### `allowedImagePrefixes?: string[]`

- Array of URL prefixes that are allowed for images
- Images not matching these prefixes will be blocked and shown as placeholders
- Use `"*"` to allow all URLs (disables filtering. However, `javascript:` and `data:` URLs are always disallowed unless `allowDataImages` is enabled)
- Default: `[]` (blocks all images)
- Example: `['https://via.placeholder.com/', '/']` or `['*']`

#### `allowDataImages?: boolean`

- When set to `true`, allows `data:image/*` URLs (base64-encoded images) in image sources
- This is useful for scenarios where images are embedded directly in markdown (e.g., documents converted from PDF or .docx)
- Only `data:image/*` URLs are allowed; other `data:` URLs (like `data:text/html`) remain blocked for security
- `data:` URLs are never allowed in links, regardless of this setting
- Default: `false` (blocks all data: URLs)
- Example: `true`

#### `allowedProtocols?: string[]`

- Array of custom URL protocols that are allowed in links
- Useful for deep links to applications (e.g., `tel:`, `mailto:`, `postman:`, `vscode:`, `slack:`)
- Use `"*"` to allow all protocols that can be parsed as valid URLs
- Dangerous protocols (`javascript:`, `data:`, `file:`, `vbscript:`) are **always blocked** regardless of this setting
- Default: `[]` (only allows built-in safe protocols: `https:`, `http:`, `mailto:`, `irc:`, `ircs:`, `xmpp:`, `blob:`)
- Example: `['tel:', 'postman:', 'vscode:']` or `['*']`

#### `linkBlockPolicy?: BlockPolicyType`

- Controls how blocked links are handled
- `"indicator"` (default): Renders as plain text with `[blocked]` suffix and the blocked URL in a title attribute
- `"text-only"`: Renders just the link text without any indicator or URL
- `"remove"`: Removes the blocked link entirely from the output

#### `imageBlockPolicy?: BlockPolicyType`

- Controls how blocked images are handled
- `"indicator"` (default): Renders as a placeholder span with `[Image blocked: {alt text}]`
- `"text-only"`: Renders just the alt text (images with no alt text are removed)
- `"remove"`: Removes the blocked image entirely from the output

#### `blockedImageClass?: string`

- When an image is blocked with the `"indicator"` policy, the replacement span includes this class for styling.

#### `blockedLinkClass?: string`

- Same as above, but for blocked links using the `"indicator"` policy.

## Examples

### Basic Usage with Default Blocking

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// Blocks all external links and images by default
const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden) // No options = blocks everything
  .use(/* your compiler */);

const result = processor.processSync(markdownContent);
```

### Allow Specific Domains

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedLinkPrefixes: [
      "https://github.com/",
      "https://docs.github.com/",
      "https://www.npmjs.com/",
    ],
    allowedImagePrefixes: [
      "https://via.placeholder.com/",
      "https://images.unsplash.com/",
      "/", // Allow relative images
    ],
  })
  .use(/* your compiler */);

const result = processor.processSync(markdownContent);
```

### Relative URL Handling

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedLinkPrefixes: ["https://mysite.com/"],
    allowedImagePrefixes: ["https://mysite.com/"],
  })
  .use(/* your compiler */);

const markdownWithRelativeUrls = `
[Relative Link](/internal-page)
![Relative Image](/images/logo.png)
`;

const result = processor.processSync(markdownWithRelativeUrls);
```

### Allow All URLs (Wildcard)

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    allowedLinkPrefixes: ["*"],
    allowedImagePrefixes: ["*"],
  })
  .use(/* your compiler */);

const markdownWithExternalUrls = `
[Any Link](https://anywhere.com/link)
![Any Image](https://untrusted-site.com/image.jpg)
[Relative Link](/internal-page)
`;

const result = processor.processSync(markdownWithExternalUrls);
// All URLs are allowed, including relative URLs like /internal-page
```

**Note**: Using `"*"` disables URL filtering entirely. Only use this when you trust the markdown source. When using wildcard without `defaultOrigin`, relative URLs are preserved as-is in the output.

### Allow Base64 Images

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedImagePrefixes: ["https://mysite.com/"],
    allowDataImages: true, // Enable base64 images
  })
  .use(/* your compiler */);

const markdownWithBase64Images = `
![Base64 Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)
![Regular Image](https://mysite.com/image.png)
`;

const result = processor.processSync(markdownWithBase64Images);
```

**Note**: This is particularly useful when converting documents from formats like PDF or .docx where images are embedded as base64. Only `data:image/*` URLs are allowed; other data: URLs remain blocked for security.

### Blob URLs

Blob URLs (`blob:`) are automatically allowed by default for both links and images. These are browser-generated URLs that reference in-memory objects and are commonly used for:
- Previewing user-uploaded files before upload
- Client-side image manipulation
- Displaying generated content

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedImagePrefixes: ["https://mysite.com/"],
  })
  .use(/* your compiler */);

const markdownWithBlobUrl = `
![Preview](blob:https://example.com/40a5fb5a-d56d-4a33-b4e2-0acf6a8e5f64)
`;

const result = processor.processSync(markdownWithBlobUrl);
// The blob: URL will be allowed even without being in allowedImagePrefixes
```

**Note**: Blob URLs are safe because they can only reference content already loaded in the browser's memory. They cannot be used to exfiltrate data or load external resources.

### Custom Protocol Support

Enable custom protocols for deep linking to applications and services:

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    allowedProtocols: ['tel:', 'mailto:', 'postman:', 'vscode:', 'slack:'],
  })
  .use(/* your compiler */);

const markdownWithCustomProtocols = `
[Call us](tel:+1234567890)
[Email support](mailto:support@example.com)
[Open in Postman](postman://open/collection)
[View in VS Code](vscode://file/path/to/file.ts)
[Join Slack](slack://channel?id=C123456)
`;

const result = processor.processSync(markdownWithCustomProtocols);
// All these custom protocol links will be allowed
```

**Common use cases:**
- **`tel:`** - Phone number links that open the dialer on mobile devices
- **`mailto:`** - Email links (allowed by default, but shown here for completeness)
- **`sms:`** - SMS/text message links
- **`postman:`**, **`vscode:`**, **`slack:`** - Deep links to desktop applications
- **Custom app protocols** - Links to your own Electron or native applications

You can also use the wildcard to allow any custom protocol:

```ts
const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    allowedProtocols: ['*'], // Allow all protocols
  })
  .use(/* your compiler */);
```

**Security Note**: Even with `allowedProtocols: ['*']`, dangerous protocols like `javascript:`, `data:`, `file:`, and `vbscript:` are **always blocked** for security. Custom protocols are safe because they trigger OS-level protocol handlers and don't execute in the browser context.

### Block Policies

Control how blocked content is handled instead of the default `[blocked]` indicator:

```ts
import { harden, BlockPolicy } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remarkRehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedLinkPrefixes: ["https://trusted.com/"],
    allowedImagePrefixes: ["https://trusted.com/"],
    linkBlockPolicy: "text-only", // Show link text only, no [blocked] indicator
    imageBlockPolicy: "remove", // Remove blocked images entirely
  })
  .use(/* your compiler */);
```

Available policies: `"indicator"` (default), `"text-only"`, `"remove"`.

### Custom Styling for Blocked Content

```ts
import { harden } from "rehype-harden";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(harden, {
    defaultOrigin: "https://mysite.com",
    allowedLinkPrefixes: ["https://trusted.com/"],
    allowedImagePrefixes: ["https://trusted.com/"],
    blockedLinkClass: "blocked-link",
    blockedImageClass: "blocked-image",
  })
  .use(/* your compiler */);

const result = processor.processSync(markdownContent);
```

## Security Features

### URL Filtering

- **Links**: Filters `href` attributes in `<a>` elements
- **Images**: Filters `src` attributes in `<img>` elements
- **Relative URLs**: Properly resolves and validates relative URLs against `defaultOrigin`
- **Path Traversal Protection**: Normalizes URLs to prevent `../` attacks
- **Wildcard Support**: Use `"*"` prefix to disable filtering (only when markdown is trusted)
- **Prefix Matching**: Validates that URLs start with allowed prefixes and have matching origins

### Blocked Content Handling

Behavior is configurable per element type via `linkBlockPolicy` and `imageBlockPolicy`:

- **`"indicator"`** (default): Blocked links show a `[blocked]` suffix; blocked images show `[Image blocked: {alt}]`
- **`"text-only"`**: Outputs just the link text or image alt text with no indicator
- **`"remove"`**: Removes blocked elements entirely from the output

### Attack Prevention

- **XSS Prevention**: Blocks `javascript:`, `data:`, `vbscript:`, `file:` and other dangerous protocols (always, regardless of configuration)
- **Redirect Protection**: Prevents unauthorized redirects to malicious sites
- **Tracking Prevention**: Blocks unauthorized image tracking pixels
- **Domain Spoofing**: Validates full URLs, not just domains
- **Safe Protocols**: Allows safe protocols including `https:`, `http:`, `mailto:`, `blob:`, and others while blocking dangerous ones
- **Custom Protocols**: Optional support for custom protocols (e.g., `tel:`, `postman:`, `vscode:`) with explicit opt-in via `allowedProtocols`

## Testing

The package includes comprehensive tests covering:

- Basic markdown rendering
- URL filtering for links and images
- Relative URL handling
- Security bypass prevention
- Edge cases and malformed URLs
- TypeScript type safety

Run tests:

```bash
pnpm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Security

If you discover a security vulnerability, please send an e-mail to <security@vercel.com>.
