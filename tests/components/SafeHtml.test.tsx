/**
 * Regression tests for the shared SafeHtml sanitizer and wrapper component.
 */
import SafeHtml, { sanitizeHtml } from '@/components/base/SafeHtml';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

const parseSanitizedHtml = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
};

describe('SafeHtml', () => {
  test('strips script tags and script content', () => {
    const sanitized = sanitizeHtml({
      html: '<strong>safe</strong><script>alert("xss")</script>',
    });
    const container = parseSanitizedHtml(sanitized);

    expect(container.querySelector('strong')).toHaveTextContent('safe');
    expect(container.querySelector('script')).toBeNull();
    expect(sanitized).not.toContain('alert("xss")');
  });

  test('strips inline event handlers from allowed tags', () => {
    const sanitized = sanitizeHtml({
      html: '<img src="/ok.png" onerror="alert(1)" /><span onclick="x()">Tap</span>',
      profile: 'markdown-output',
    });
    const container = parseSanitizedHtml(sanitized);
    const image = container.querySelector('img');
    const span = container.querySelector('span');

    expect(image).toHaveAttribute('src', '/ok.png');
    expect(image).not.toHaveAttribute('onerror');
    expect(span).toHaveTextContent('Tap');
    expect(span).not.toHaveAttribute('onclick');
  });

  test('strips javascript and vbscript URI payloads', () => {
    const sanitized = sanitizeHtml({
      html: '<a href="javascript:alert(1)">Open</a><img src="vbscript:msgbox(1)" alt="bad" />',
      profile: 'markdown-output',
    });
    const container = parseSanitizedHtml(sanitized);
    const link = container.querySelector('a');
    const image = container.querySelector('img');

    expect(link).toHaveTextContent('Open');
    expect(link).not.toHaveAttribute('href');
    expect(image).toHaveAttribute('alt', 'bad');
    expect(image).not.toHaveAttribute('src');
  });

  test('allows image data URIs but blocks other data URIs', () => {
    const sanitized = sanitizeHtml({
      html: '<img src="data:image/png;base64,AAAA" alt="preview" /><a href="data:text/html;base64,AAAA">bad</a>',
      profile: 'markdown-output',
    });
    const container = parseSanitizedHtml(sanitized);
    const image = container.querySelector('img');
    const link = container.querySelector('a');

    expect(image).toHaveAttribute('src', 'data:image/png;base64,AAAA');
    expect(link).toHaveTextContent('bad');
    expect(link).not.toHaveAttribute('href');
  });

  test('preserves benign markdown HTML and hardens target blank links', () => {
    const sanitized = sanitizeHtml({
      html: '<p><a href="https://example.com" target="_blank">Docs</a></p><ul><li>Item</li></ul>',
      profile: 'markdown-output',
    });
    const container = parseSanitizedHtml(sanitized);
    const link = container.querySelector('a');

    expect(container.querySelector('p')).toBeTruthy();
    expect(container.querySelector('ul li')).toHaveTextContent('Item');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('round trips plaintext untouched', () => {
    expect(sanitizeHtml({ html: 'Plain text only' })).toBe('Plain text only');
  });

  test('supports explicitly allowed custom tags and attributes', () => {
    const sanitized = sanitizeHtml({
      html: '<variable data-key="user.name">user.name</variable>',
      profile: 'markdown-output',
      allowedAttributes: ['data-key'],
      allowedTags: ['variable'],
    });
    const container = parseSanitizedHtml(sanitized);
    const variable = container.querySelector('variable');

    expect(variable).toHaveTextContent('user.name');
    expect(variable).toHaveAttribute('data-key', 'user.name');
  });

  test('renders the requested wrapper element', () => {
    render(
      <SafeHtml
        as="p"
        data-testid="safe-html"
        html="Hello <strong>team</strong>"
      />,
    );

    const wrapper = screen.getByTestId('safe-html');
    expect(wrapper.tagName).toBe('P');
    expect(wrapper).toContainHTML('Hello <strong>team</strong>');
  });
});
