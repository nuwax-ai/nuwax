// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { ThemeFiles, ThemeSnapshot } from './index.mjs';
import {
  assertInstallableThemeId,
  deepSeekThemePackage,
  defaultTokens,
  encodeThemeText as enc,
  limits,
  officialThemePackage,
  resolveThemePackage,
  tokenToAntd,
  tokenToCssVariables,
  validateThemePackage,
} from './index.mjs';
const manifest = (
  variants: unknown = {
    light: { tokens: 'tokens.json', styles: { common: ['theme.css'] } },
  },
) => ({
  schemaVersion: 1,
  id: 'sample-theme',
  name: '示例',
  version: '1.0.0',
  variants,
});
function files(
  css = 'body {color: var(--nuwax-text-primary)}',
  tokens: unknown = { primary: '#334455' },
): ThemeFiles {
  return {
    'theme.json': enc(JSON.stringify(manifest())),
    'tokens.json': enc(JSON.stringify(tokens)),
    'theme.css': enc(css),
  };
}
function snap(
  f = files(),
  preference: 'light' | 'dark' | 'system' = 'light',
): ThemeSnapshot {
  return resolveThemePackage(validateThemePackage(f), preference, true, 7);
}
describe('portable theme contract', () => {
  it('normalizes sibling resource paths without allowing package escape', () => {
    const f = files();
    f['theme.json'] = enc(
      JSON.stringify(
        manifest({
          light: {
            tokens: 'tokens.json',
            styles: { common: ['styles/theme.css'] },
          },
        }),
      ),
    );
    delete f['theme.css'];
    f['styles/theme.css'] = enc('.a {background:url(../assets/pixel.png)}');
    const png = new Uint8Array(24);
    png.set([137, 80, 78, 71, 13, 10, 26, 10]);
    f['assets/pixel.png'] = btoa(String.fromCharCode(...png));
    expect(snap(f).css.web).toContain('theme-asset:assets%2Fpixel.png');
    f['styles/theme.css'] = enc('.a {background:url(../../assets/pixel.png)}');
    expect(() => snap(f)).toThrow(/escapes package/);
  });
  it('merges partial tokens, falls back to the available mode, and is JSON safe', () => {
    const p = validateThemePackage(files());
    const s = resolveThemePackage(
      JSON.parse(JSON.stringify(p)),
      'dark',
      false,
      3,
    );
    expect(s.mode).toBe('light');
    expect(s.tokens.primary).toBe('#334455');
    expect(s.tokens['app.bg']).toBe('#ffffff');
    expect(Object.keys(s.tokens)).toEqual(Object.keys(defaultTokens.light));
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
    expect(s.css.web).toContain('[data-theme-surface=');
    expect(s.css.shell).toContain('shell');
  });
  it('supports dark-only variants and ordered common/surface CSS', () => {
    const f = files();
    f['theme.json'] = enc(
      JSON.stringify(
        manifest({
          dark: {
            tokens: 'tokens.json',
            styles: { common: ['a.css'], repo: ['b.css'] },
          },
        }),
      ),
    );
    f['a.css'] = enc('.a {color:red}');
    f['b.css'] = enc('.b {color:blue}');
    const s = snap(f, 'system');
    expect(s.mode).toBe('dark');
    expect(s.tokens['app.bg']).toBe('#18181b');
    expect(s.css.repo.indexOf('.a')).toBeLessThan(s.css.repo.indexOf('.b'));
    expect(s.css.web).not.toContain('.b');
  });
  it('provides complete coherent builtins and deterministic mappings', () => {
    const s = resolveThemePackage(officialThemePackage, 'light', false, 0);
    expect(s.tokens.primary).toBe('#2563eb');
    expect(s.tokens['surface.bg']).toBe('#f3f4f6');
    expect(
      resolveThemePackage(officialThemePackage, 'system', true, 1).mode,
    ).toBe('dark');
    expect(snap(deepSeekThemePackage.files).themeId).toBe('deepseek-inspired');
    const vars = tokenToCssVariables(s.tokens);
    for (const prefix of ['nuwax', 'xagi', 'v2'])
      expect(vars[`--${prefix}-color-primary`]).toBe('#2563eb');
    expect(vars['--v2-color-text-secondary']).toBe(s.tokens['text.secondary']);
    expect(vars['--nuwax-chat-think-bg']).toBe(s.tokens['chat.think.bg']);
    expect(tokenToAntd(s.tokens)).toMatchObject({
      colorPrimary: '#2563eb',
      fontSize: 14,
      borderRadius: 8,
    });
    expect(() => assertInstallableThemeId('nuwax-default')).toThrow('reserved');
    expect(() => assertInstallableThemeId('sample')).not.toThrow();
  });
  it.each(['light', 'dark'] as const)(
    'maps %s inverse text to filled controls',
    (mode) => {
      const snapshot = resolveThemePackage(
        officialThemePackage,
        mode,
        false,
        1,
      );
      expect(tokenToAntd(snapshot.tokens).colorTextLightSolid).toBe(
        snapshot.tokens['text.inverse'],
      );
      expect(tokenToAntd(snapshot.tokens)).toMatchObject({
        colorTextHeading: snapshot.tokens['text.primary'],
        colorLink: snapshot.tokens.primary,
        colorLinkHover: snapshot.tokens['primary.hover'],
        colorBgLayout: snapshot.tokens['surface.bg'],
        colorFillAlter: snapshot.tokens['surface.bg'],
        colorTextPlaceholder: snapshot.tokens['text.secondary'],
      });
    },
  );
  it('rewrites relative resource references to explicit encoded placeholders', () => {
    const f = files('.image {background-image:url("images/pixel.png")}');
    // PNG signature + IHDR header; no execution/decoding needed for magic validation.
    f['images/pixel.png'] = btoa(
      String.fromCharCode(
        137,
        80,
        78,
        71,
        13,
        10,
        26,
        10,
        ...Array(16).fill(0),
      ),
    );
    const s = snap(f);
    expect(s.css.web).toContain('theme-asset:images%2Fpixel.png');
    expect(s.assets['images/pixel.png'].mime).toBe('image/png');
  });
  it('keeps normal, functional and root selectors inside every surface', () => {
    const s = snap(
      files(
        ':root:hover > [data-theme-part="card"], :is(.a,.b):not(.c):has(> .child) {color:red} @media (min-width: 10px) { .z {color:blue} }',
      ),
    );
    for (const surface of ['web', 'shell', 'message', 'repo'] as const) {
      const css = s.css[surface];
      expect(css).toContain(`data-theme-surface=${surface}`);
      expect(css).not.toContain(':root');
      expect(css).toContain(`] :is(.a,.b)`);
      expect(css).toContain('] .z');
    }
  });
});
describe('untrusted packages', () => {
  it.each([
    '../x.css',
    '/x.css',
    'C:/x.css',
    'a/../x.css',
    'a\\x.css',
    'https://x.css',
    'a%2fx.css',
    'a//x.css',
    './x.css',
    'a/ x.css',
    'a/../theme.json',
    'a\u0000.css',
    'a./x.css',
    'CON/x.css',
    '__proto__/x.css',
  ])('rejects unsafe path %s', (p) =>
    expect(() => validateThemePackage({ ...files(), [p]: enc('') })).toThrow(),
  );
  it('rejects case collisions, executable types, corrupted resources and prototype keys', () => {
    expect(() =>
      validateThemePackage({ ...files(), 'Theme.css': enc('') }),
    ).toThrow('colliding');
    for (const path of ['x.svg', 'x.html', 'x.js', 'x.exe', 'readme.md'])
      expect(() =>
        validateThemePackage({ ...files(), [path]: enc('') }),
      ).toThrow('unsupported');
    for (const path of ['x.png', 'x.jpg', 'x.webp', 'x.woff2'])
      expect(() =>
        validateThemePackage({ ...files(), [path]: enc('not binary') }),
      ).toThrow('magic');
    expect(() =>
      validateThemePackage(JSON.parse('{"__proto__":""}')),
    ).toThrow();
    const f = files();
    f['tokens.json'] = enc('{"__proto__":{"primary":"#fff"}}');
    expect(() => validateThemePackage(f)).toThrow('forbidden');
    expect(() => validateThemePackage(Object.create({ bad: 'x' }))).toThrow(
      'plain object',
    );
  });
  it('identifies malformed manifest/resource/token fields', () => {
    const f = files();
    f['theme.json'] = enc('{');
    expect(() => validateThemePackage(f)).toThrow('theme.json');
    for (const t of [
      { unknown: '#fff' },
      { primary: 3 },
      { primary: 'url(https://evil)' },
      { 'font.family': 'url(evil)' },
      { 'font.size': '2rem' },
      { 'radius.large': '-1px' },
    ])
      expect(() => validateThemePackage(files('', t))).toThrow('tokens.json');
    const noVariants = files();
    noVariants['theme.json'] = enc(JSON.stringify(manifest({})));
    expect(() => validateThemePackage(noVariants)).toThrow('variants');
    const missing = files();
    delete missing['tokens.json'];
    expect(() => validateThemePackage(missing)).toThrow('tokens');
    expect(() =>
      validateThemePackage(files('.a{background:url(missing.png)}')),
    ).toThrow('theme.css');
  });
  it.each([
    '.a{background:url(https://evil/a.png)}',
    '.a{background:url(//evil/a.png)}',
    '.a{background:url(data:image/png;base64,AAAA)}',
    '.a{background:url(file:///tmp/a.png)}',
    '.a{background:url(../a.png)}',
    '.a{background:url(a%2epng)}',
    '.a{background:u\\72l(https://evil)}',
    '.a{background:url("\\68 ttps://evil")}',
    '@import "a.css";',
    '@font-face{font-family:evil;src:url(a.woff2)}',
    '@keyframes x{from{color:red}}',
    '@page {color:red}',
    '@layer x {.a{color:red}}',
    '.a{color:expression(alert(1))}',
    '.a{behavior:url(x.png)}',
    '.a{--image:url(x.png)}',
    '.a{background:image-set("https://evil" 1x)}',
    '.a{color:var(--host-image)}',
    ':root:hover + .outside{color:red}',
    ':root ~ .outside{color:red}',
    'body:focus ~ .outside{color:red}',
    ':is(body,.x){color:red}',
    '.x :root{color:red}',
    ':global(.x){color:red}',
    '.a{& .b{color:red}}',
    '.a {color: rgb(1,2,3}',
  ])('rejects unsafe or unsupported CSS: %s', (css) =>
    expect(() => validateThemePackage(files(css))).toThrow('theme.css'),
  );
  it('rejects invalid base64 and strict UTF-8', () => {
    for (const b of ['A', '!!!!', 'AB==', 'YWJj\n', '_abc'])
      expect(() =>
        validateThemePackage({ ...files(), 'README.md': b }),
      ).toThrow('README.md');
    expect(() =>
      validateThemePackage({ ...files(), 'README.md': btoa('\xc0\xaf') }),
    ).toThrow('UTF-8');
  });
  it('enforces decoded file count, per-file and aggregate caps', () => {
    const many = files();
    for (let i = 0; i < 500; i++) many[`x${i}.css`] = enc('');
    expect(() => validateThemePackage(many)).toThrow('500');
    const over = btoa('a'.repeat(limits.fileBytes + 1));
    expect(() =>
      validateThemePackage({ ...files(), 'README.md': over }),
    ).toThrow(/size/);
    const block = enc(' '.repeat(limits.fileBytes));
    const total = files();
    for (let i = 0; i < 4; i++) total[`big${i}.css`] = block;
    expect(() => validateThemePackage(total)).toThrow('20 MiB');
  });
});
