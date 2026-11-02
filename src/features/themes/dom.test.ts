import { describe, expect, it, vi } from 'vitest';
import {
  encodeThemeText,
  officialThemePackage,
  resolveThemePackage,
  validateThemePackage,
} from './core';
import { createMicroThemePayload, createThemeApplicator } from './dom';

// Minimal DOM contract avoids requiring a browser emulator dependency.
function fixture() {
  const properties = new Map<string, string>(),
    attrs = new Map<string, string>(),
    children: unknown[] = [{ content: 'React tree' }];
  const createObjectURL = vi.fn(
      () => `blob:test-${createObjectURL.mock.calls.length}`,
    ),
    revokeObjectURL = vi.fn();
  const doc = {
    defaultView: { URL: { createObjectURL, revokeObjectURL } },
    createElement: () => {
      const node = {
        textContent: '',
        remove: () => {
          const i = children.indexOf(node);
          if (i >= 0) children.splice(i, 1);
        },
      };
      return node;
    },
  };
  const root = {
    ownerDocument: doc,
    getAttribute: (key: string) => attrs.get(key) ?? null,
    setAttribute: (key: string, value: string) => attrs.set(key, value),
    removeAttribute: (key: string) => attrs.delete(key),
    appendChild: (node: unknown) => {
      children.push(node);
    },
    style: {
      getPropertyValue: (key: string) => properties.get(key) ?? '',
      getPropertyPriority: () => '',
      setProperty: (key: string, value: string) => properties.set(key, value),
      removeProperty: (key: string) => properties.delete(key),
    },
  } as unknown as HTMLElement;
  return {
    root,
    children,
    attrs,
    properties,
    createObjectURL,
    revokeObjectURL,
  };
}
const snapshot = (revision: number) =>
  resolveThemePackage(officialThemePackage, 'light', false, revision);
describe('theme DOM application', () => {
  it('ignores old/equal revisions without remounting and restores owned state', () => {
    const f = fixture(),
      content = f.children[0];
    f.root.style.setProperty('color', 'red');
    const app = createThemeApplicator(f.root, 'web');
    expect(app.apply(snapshot(2))).toBe(true);
    expect(app.apply(snapshot(2))).toBe(false);
    expect(app.apply(snapshot(1))).toBe(false);
    expect(f.children[0]).toBe(content);
    expect(f.children).toHaveLength(2);
    expect(f.attrs.get('data-theme-surface')).toBe('web');
    app.dispose();
    app.dispose();
    expect(f.children).toEqual([content]);
    expect(f.attrs.size).toBe(0);
    expect(f.properties).toEqual(new Map([['color', 'red']]));
    expect(app.apply(snapshot(3))).toBe(false);
  });
  it('publishes replacement stylesheet before revoking old URLs', () => {
    const f = fixture(),
      app = createThemeApplicator(f.root, 'web');
    const one = snapshot(1);
    one.assets['assets/a.png'] = { mime: 'image/png', base64: 'YQ==' };
    one.css.web = 'a{background:url("theme-asset:assets%2Fa.png")}';
    app.apply(one);
    f.revokeObjectURL.mockImplementation(() => {
      expect(f.children).toHaveLength(2);
      expect((f.children[1] as { textContent: string }).textContent).toContain(
        'blob:test-2',
      );
    });
    app.apply({ ...one, revision: 2 });
    expect(f.createObjectURL).toHaveBeenCalledTimes(2);
    expect(f.revokeObjectURL).toHaveBeenCalledTimes(1);
    f.revokeObjectURL.mockImplementation(() => undefined);
    app.dispose();
    expect(f.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
  it('rejects malformed asset encodings and releases partially allocated URLs', () => {
    const f = fixture(),
      one = snapshot(1);
    one.assets['a.png'] = { mime: 'image/png', base64: 'YQ==' };
    one.css.web = 'url(theme-asset:a.png) url(theme-asset:%ZZ)';
    expect(() => createMicroThemePayload(one, f.root.ownerDocument)).toThrow();
    expect(f.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});

it('retains live DOM nodes, focus and event handlers across theme changes', () => {
  const root = document.createElement('div'),
    input = document.createElement('input'),
    button = document.createElement('button');
  root.append(input, button);
  document.body.append(root);
  const click = vi.fn();
  button.addEventListener('click', click);
  input.value = 'draft';
  input.focus();
  const app = createThemeApplicator(root, 'message');
  app.apply(snapshot(1));
  app.apply(snapshot(2));
  button.click();
  expect(root.firstChild).toBe(input);
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe('draft');
  expect(click).toHaveBeenCalledOnce();
  app.dispose();
  expect(root.childNodes).toHaveLength(2);
  root.remove();
});

it('scopes web CSS outside nested microapp surfaces, including pseudo elements', () => {
  const files = { ...officialThemePackage.files };
  const manifest = {
    ...officialThemePackage.manifest,
    variants: {
      light: {
        tokens: 'light.json',
        styles: { web: ['custom.css'] },
      },
    },
  };
  files['theme.json'] = encodeThemeText(JSON.stringify(manifest));
  files['custom.css'] = encodeThemeText(
    '[data-theme-part="input"] {color:red} .field::before {content:"x"}',
  );
  const css = resolveThemePackage(
    validateThemePackage(files),
    'light',
    false,
    1,
  ).css.web;
  const selector = css.slice(0, css.indexOf('{')).trim();
  const web = document.createElement('div');
  web.dataset.themeSurface = 'web';
  web.innerHTML =
    '<input data-theme-part="input"/><section data-theme-surface="message"><input data-theme-part="input"/></section>';
  document.body.appendChild(web);
  const inputs = web.querySelectorAll('input');
  expect(inputs[0].matches(selector)).toBe(true);
  expect(inputs[1].matches(selector)).toBe(false);
  expect(css).toMatch(/\)\)::before/);
  web.remove();
});
