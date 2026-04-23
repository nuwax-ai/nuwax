/**
 * SafeHtml centralizes user-authored HTML rendering behind DOMPurify so that
 * non-Markdown render paths share one conservative XSS boundary.
 *
 * Threat model:
 * - blocks script tags, event handler attributes, iframe/object-style embeds
 * - blocks javascript:/vbscript: URLs
 * - only allows data: URIs for image sources
 * - keeps profile-based allowlists narrow so each call-site can opt into just
 *   the markup shape it needs
 *
 * Profile intent:
 * - strict: inline formatting only
 * - markdown-output: common rich-text/markdown HTML
 * - svg: sanitized inline SVG fragments
 */
import createDOMPurify, { type Config, type DOMPurify } from 'dompurify';
import React, { useMemo } from 'react';

export type SafeHtmlProfile = 'strict' | 'markdown-output' | 'svg';

export interface SafeHtmlOptions {
  html?: string | null;
  profile?: SafeHtmlProfile;
  allowedTags?: string[];
  allowedAttributes?: string[];
}

export interface SafeHtmlProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'children'>,
    SafeHtmlOptions {
  as?: keyof React.JSX.IntrinsicElements;
}

const SAFE_IMAGE_DATA_URI_RE =
  /^data:image\/(?:bmp|gif|jpeg|jpg|png|svg\+xml|webp);base64,[a-z0-9+/]+=*$/i;
const SAFE_URI_BASE = 'https://safe-html.invalid';
const SAFE_URI_ATTRIBUTES = new Set([
  'action',
  'cite',
  'formaction',
  'href',
  'poster',
  'src',
  'xlink:href',
]);
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const COMMON_FORBID_TAGS = [
  'audio',
  'base',
  'embed',
  'form',
  'iframe',
  'input',
  'link',
  'meta',
  'object',
  'script',
  'style',
  'textarea',
  'video',
];
const COMMON_FORBID_ATTRIBUTES = ['formaction', 'srcset'];
const COMMON_FORBID_CONTENTS = ['script', 'style', 'iframe', 'object', 'embed'];

const STRICT_ALLOWED_TAGS = [
  'a',
  'abbr',
  'b',
  'br',
  'code',
  'em',
  'i',
  'kbd',
  'mark',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'u',
];
const STRICT_ALLOWED_ATTRIBUTES = [
  'aria-hidden',
  'aria-label',
  'class',
  'dir',
  'href',
  'lang',
  'rel',
  'role',
  'target',
  'title',
];
const MARKDOWN_ALLOWED_TAGS = [
  ...STRICT_ALLOWED_TAGS,
  'blockquote',
  'del',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
];
const MARKDOWN_ALLOWED_ATTRIBUTES = [
  ...STRICT_ALLOWED_ATTRIBUTES,
  'alt',
  'colspan',
  'height',
  'scope',
  'src',
  'width',
];

let sanitizerInstance: DOMPurify | null | undefined;

const toUniqueList = (values: string[]) => Array.from(new Set(values));

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const isSafeUri = (value: string, attributeName: string) => {
  const normalized = value.trim().replace(/[\u0000-\u001F\u007F]+/g, '');
  if (!normalized) {
    return true;
  }

  if (
    normalized.startsWith('#') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../') ||
    normalized.startsWith('?') ||
    normalized.startsWith('//')
  ) {
    return true;
  }

  if (normalized.toLowerCase().startsWith('data:')) {
    return attributeName === 'src' && SAFE_IMAGE_DATA_URI_RE.test(normalized);
  }

  try {
    const parsed = new URL(normalized, SAFE_URI_BASE);
    return SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
};

const getSanitizer = () => {
  if (sanitizerInstance !== undefined) {
    return sanitizerInstance;
  }

  if (typeof window === 'undefined' || !window.document) {
    sanitizerInstance = null;
    return sanitizerInstance;
  }

  sanitizerInstance = createDOMPurify(window);
  sanitizerInstance.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof window.Element)) {
      return;
    }

    Array.from(node.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      if (!SAFE_URI_ATTRIBUTES.has(attributeName)) {
        return;
      }

      if (!isSafeUri(attribute.value, attributeName)) {
        node.removeAttribute(attribute.name);
      }
    });

    if (
      node.nodeName.toLowerCase() === 'a' &&
      node.getAttribute('target') === '_blank'
    ) {
      const relValues = new Set(
        (node.getAttribute('rel') || '')
          .split(/\s+/)
          .filter(Boolean)
          .map((value) => value.toLowerCase()),
      );
      relValues.add('noopener');
      relValues.add('noreferrer');
      node.setAttribute('rel', Array.from(relValues).join(' '));
    }
  });

  return sanitizerInstance;
};

const buildConfig = ({
  profile = 'strict',
  allowedAttributes = [],
  allowedTags = [],
}: Omit<Required<SafeHtmlOptions>, 'html'>): Config => {
  const sharedConfig: Config = {
    ADD_FORBID_CONTENTS: COMMON_FORBID_CONTENTS,
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: true,
    FORBID_ATTR: COMMON_FORBID_ATTRIBUTES,
    SANITIZE_DOM: true,
    SANITIZE_NAMED_PROPS: true,
  };

  if (profile === 'svg') {
    return {
      ...sharedConfig,
      ADD_ATTR: toUniqueList(allowedAttributes),
      ADD_TAGS: toUniqueList(allowedTags),
      FORBID_TAGS: [
        ...COMMON_FORBID_TAGS,
        'animate',
        'discard',
        'foreignObject',
        'set',
      ],
      USE_PROFILES: { svg: true, svgFilters: true },
    };
  }

  const baseTags =
    profile === 'markdown-output' ? MARKDOWN_ALLOWED_TAGS : STRICT_ALLOWED_TAGS;
  const baseAttributes =
    profile === 'markdown-output'
      ? MARKDOWN_ALLOWED_ATTRIBUTES
      : STRICT_ALLOWED_ATTRIBUTES;

  return {
    ...sharedConfig,
    ALLOWED_ATTR: toUniqueList([...baseAttributes, ...allowedAttributes]),
    ALLOWED_TAGS: toUniqueList([...baseTags, ...allowedTags]),
    FORBID_TAGS: COMMON_FORBID_TAGS,
  };
};

export const sanitizeHtml = ({
  html = '',
  profile = 'strict',
  allowedAttributes = [],
  allowedTags = [],
}: SafeHtmlOptions): string => {
  if (!html) {
    return '';
  }

  const sanitizer = getSanitizer();
  if (!sanitizer || !sanitizer.isSupported) {
    return escapeHtml(html);
  }

  return String(
    sanitizer.sanitize(
      html,
      buildConfig({
        allowedAttributes,
        allowedTags,
        profile,
      }),
    ),
  );
};

const SafeHtml: React.FC<SafeHtmlProps> = ({
  allowedAttributes,
  allowedTags,
  as = 'div',
  html,
  profile = 'strict',
  ...restProps
}) => {
  const sanitizedHtml = useMemo(
    () =>
      sanitizeHtml({
        allowedAttributes,
        allowedTags,
        html,
        profile,
      }),
    [allowedAttributes, allowedTags, html, profile],
  );

  return React.createElement(as, {
    ...restProps,
    dangerouslySetInnerHTML: { __html: sanitizedHtml },
  });
};

export default SafeHtml;
