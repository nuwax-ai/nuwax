import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import valueParser from 'postcss-value-parser';
import { defaultTokens, surfaces, tokenNames } from './tokens.mjs';
export const limits = Object.freeze({
  files: 500,
  fileBytes: 5 * 1024 * 1024,
  totalBytes: 20 * 1024 * 1024,
});
const fail = (where, message) => {
  throw new Error(`${where}: ${message}`);
};
const own = (o, k) => Object.hasOwn(o, k);
const object = (v, w) => {
  if (
    !v ||
    typeof v !== 'object' ||
    Array.isArray(v) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(v))
  )
    fail(w, 'expected plain object');
};
export function canonicalPath(p, where = String(p)) {
  if (
    typeof p !== 'string' ||
    p.length > 240 ||
    !p ||
    /[^a-zA-Z0-9_. /-]/.test(p) ||
    p.startsWith('/') ||
    p
      .split('/')
      .some(
        (x) =>
          !x ||
          x === '.' ||
          x === '..' ||
          x.trim() !== x ||
          x.endsWith('.') ||
          /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(x) ||
          ['__proto__', 'prototype', 'constructor'].includes(x.toLowerCase()),
      )
  )
    fail(where, 'unsafe canonical relative path');
  return p;
}
function decode(b, w) {
  if (
    typeof b !== 'string' ||
    b.length > Math.ceil(limits.fileBytes / 3) * 4 ||
    b.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(b)
  )
    fail(w, 'invalid base64 or file size');
  let raw;
  try {
    raw = atob(b);
  } catch {
    fail(w, 'invalid base64');
  }
  if (btoa(raw) !== b) fail(w, 'noncanonical base64');
  if (raw.length > limits.fileBytes) fail(w, 'file size limit');
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
function utf(bytes, w) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    fail(w, 'invalid UTF-8');
  }
}
function json(bytes, w) {
  let v;
  try {
    v = JSON.parse(utf(bytes, w));
  } catch (e) {
    fail(w, `invalid JSON (${e.message})`);
  }
  const walk = (x, path, depth = 0) => {
    if (depth > 64) fail(path, 'JSON nesting limit');
    if (x && typeof x === 'object')
      for (const k of Object.keys(x)) {
        if (['__proto__', 'constructor', 'prototype'].includes(k))
          fail(path + '.' + k, 'forbidden key');
        walk(x[k], path + '.' + k, depth + 1);
      }
  };
  walk(v, w);
  return v;
}
function fields(o, allowed, w) {
  object(o, w);
  for (const k of Object.keys(o))
    if (!allowed.includes(k)) fail(w + '.' + k, 'unknown field');
}
function text(v, w, max = 200) {
  if (
    typeof v !== 'string' ||
    !v.trim() ||
    v.length > max ||
    /[\x00-\x1f\x7f]/.test(v)
  )
    fail(w, 'invalid text');
}
function tokens(v, w) {
  object(v, w);
  for (const [k, x] of Object.entries(v)) {
    if (!tokenNames.includes(k)) fail(w + '.' + k, 'unknown token');
    if (typeof x !== 'string') fail(w + '.' + k, 'expected string');
    const valid =
      k === 'font.family' || k === 'font.code'
        ? /^[a-zA-Z0-9 ,"'-]{1,160}$/.test(x)
        : k === 'font.size' ||
          k.startsWith('radius.') ||
          k.startsWith('spacing.')
        ? /^(?:0|(?:\d{1,3}(?:\.\d{1,2})?)px)$/.test(x)
        : /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
            x,
          );
    if (!valid || (k === 'font.size' && parseFloat(x) === 0))
      fail(
        w + '.' + k,
        'invalid value (hex colors, px dimensions, literal fonts only)',
      );
  }
  return v;
}
const mimeFor = (p) =>
  ({
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    woff2: 'font/woff2',
  }[p.split('.').pop().toLowerCase()]);
function binary(bytes, p) {
  const hex = (...a) => a.every((n, i) => bytes[i] === n);
  const mime = mimeFor(p);
  const ok =
    mime === 'image/png'
      ? bytes.length >= 24 && hex(137, 80, 78, 71, 13, 10, 26, 10)
      : mime === 'image/jpeg'
      ? bytes.length >= 4 &&
        hex(255, 216, 255) &&
        bytes.at(-2) === 255 &&
        bytes.at(-1) === 217
      : mime === 'image/webp'
      ? bytes.length >= 16 &&
        hex(82, 73, 70, 70) &&
        String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
      : mime === 'font/woff2'
      ? bytes.length >= 48 && hex(119, 79, 70, 50)
      : false;
  if (!ok) fail(p, 'invalid resource magic bytes');
}
function assetPath(url, file, files) {
  const base = file.split('/').slice(0, -1);
  if (
    typeof url !== 'string' ||
    !url ||
    url.length > 240 ||
    /[^a-zA-Z0-9_. /-]/.test(url) ||
    url.startsWith('/')
  )
    fail(file, 'unsafe resource URL');
  // CSS 可以引用相邻 assets 目录，但归一化后的路径必须仍在包根内。
  for (const part of url.split('/')) {
    if (part === '.') continue;
    if (part === '..') {
      if (!base.length) fail(file, 'resource URL escapes package');
      base.pop();
    } else {
      if (!part || part.trim() !== part) fail(file, 'unsafe resource URL');
      base.push(part);
    }
  }
  const p = base.join('/');
  canonicalPath(p, file + ' url');
  if (!own(files, p) || !mimeFor(p))
    fail(file, `url references missing/unsupported resource ${url}`);
  return p;
}
function css(source, file, surface, files) {
  if (source.includes('\\') || source.includes('\u0000'))
    fail(file, 'CSS escapes and NUL unsupported');
  let ast;
  try {
    ast = postcss.parse(source, { from: file });
  } catch (e) {
    fail(file, `CSS ${e.reason}`);
  }
  ast.walkAtRules((a) => {
    if (
      !['media', 'supports'].includes(a.name.toLowerCase()) ||
      a.name !== a.name.toLowerCase() ||
      /[\\{};@]/.test(a.params)
    )
      fail(file, `unsupported @${a.name}`);
    if (!a.nodes || (a.parent.type !== 'root' && a.parent.type !== 'atrule'))
      fail(file, 'invalid at-rule placement');
    const parsed = valueParser(a.params);
    parsed.walk((n) => {
      if (
        n.type === 'function' &&
        !['', 'not', 'and', 'or', 'selector'].includes(n.value.toLowerCase())
      )
        fail(file, 'unsupported at-rule condition');
    });
  });
  ast.walkRules((rule) => {
    if (rule.parent.type !== 'root' && rule.parent.type !== 'atrule')
      fail(file, 'nested CSS rules unsupported');
    try {
      rule.selector = selectorParser((selectors) => {
        selectors.each((sel) => {
          if (!sel.nodes.length || sel.first.type === 'combinator')
            fail(file, 'relative selector unsupported');
          sel.walk((n) => {
            if (
              n.type === 'nesting' ||
              n.type === 'comment' ||
              n.type === 'string' ||
              n.toString().includes('\\')
            )
              fail(file, 'unsupported selector');
            if (
              n.type === 'pseudo' &&
              ![
                ':root',
                ':is',
                ':where',
                ':not',
                ':has',
                ':hover',
                ':active',
                ':focus',
                ':focus-visible',
                ':focus-within',
                ':disabled',
                ':enabled',
                ':checked',
                ':first-child',
                ':last-child',
                ':nth-child',
                ':nth-of-type',
                '::before',
                '::after',
                '::placeholder',
                '::selection',
                ':empty',
              ].includes(n.value)
            )
              fail(file, `unsupported pseudo ${n.value}`);
            if (
              n.type === 'combinator' &&
              ![' ', '>', '+', '~'].includes(n.value)
            )
              fail(file, 'unsupported combinator');
            if (
              (n.type === 'tag' && n.namespace) ||
              (n.type === 'universal' && n.namespace)
            )
              fail(file, 'namespaced selector unsupported');
            if (
              (n.type === 'tag' &&
                ['html', 'body'].includes(n.value.toLowerCase())) ||
              (n.type === 'pseudo' && n.value === ':root')
            ) {
              if (n.parent !== sel || n !== sel.first)
                fail(file, 'root selector must be first and top-level');
            }
          });
          const first = sel.first;
          first.spaces.before = '';
          if (
            (first.type === 'tag' &&
              ['html', 'body'].includes(first.value.toLowerCase())) ||
            (first.type === 'pseudo' && first.value === ':root')
          ) {
            for (const node of sel.nodes.slice(1)) {
              if (node.type === 'combinator') {
                if (['+', '~'].includes(node.value))
                  fail(file, 'root sibling escape');
                break;
              }
            }
            first.replaceWith(
              selectorParser.attribute({
                attribute: 'data-theme-surface',
                operator: '=',
                value: surface,
                quoteMark: '"',
              }),
            );
          } else
            sel.prepend(selectorParser.combinator({ value: ' ' })),
              sel.prepend(
                selectorParser.attribute({
                  attribute: 'data-theme-surface',
                  operator: '=',
                  value: surface,
                  quoteMark: '"',
                }),
              );
          // Host and qiankun surfaces share a document. Stop matching at a nested
          // surface boundary; :where keeps the author's selector specificity.
          const boundary = `[data-theme-surface=${surface}] [data-theme-surface]`;
          const guard = selectorParser()
            .astSync(`:where(:not(${boundary}, ${boundary} *))`)
            .first.first.clone();
          const pseudoElement = sel.nodes.find(
            (node) => node.type === 'pseudo' && node.value.startsWith('::'),
          );
          if (pseudoElement) sel.insertBefore(pseudoElement, guard);
          else sel.append(guard);
        });
      }).processSync(rule.selector);
    } catch (e) {
      fail(file, `selector: ${e.message}`);
    }
  });
  ast.walkDecls((d) => {
    if (d.parent.type !== 'rule') fail(file, 'declaration outside rule');
    if (
      !/^[a-z-]+$/.test(d.prop) ||
      (d.prop.startsWith('--') && d.prop !== '--nuwax-background-image') ||
      /^(?:behavior|-moz-binding|animation|transition|all|page|view-transition)/.test(
        d.prop,
      )
    )
      fail(file, `unsupported property ${d.prop}`);
    if (/[\\\x00-\x08\x0b\x0c\x0e-\x1f]/.test(d.value))
      fail(file, 'escaped/control CSS value unsupported');
    const v = valueParser(d.value);
    v.walk((n) => {
      if (n.unclosed) fail(file, 'unclosed CSS value');
      if (n.type === 'function') {
        const fn = n.value.toLowerCase();
        if (fn === 'url') {
          if (
            n.nodes.length !== 1 ||
            !['word', 'string'].includes(n.nodes[0].type)
          )
            fail(file, 'invalid url');
          const p = assetPath(n.nodes[0].value, file, files);
          n.nodes = [
            {
              type: 'string',
              quote: '"',
              value: `theme-asset:${encodeURIComponent(p)}`,
            },
          ];
          return false;
        }
        if (
          ![
            'var',
            'rgb',
            'rgba',
            'hsl',
            'hsla',
            'calc',
            'min',
            'max',
            'clamp',
            'linear-gradient',
            'radial-gradient',
            'repeating-linear-gradient',
            'repeating-radial-gradient',
          ].includes(fn)
        )
          fail(file, `unsupported CSS function ${fn}`);
        if (
          fn === 'var' &&
          (n.nodes.length !== 1 ||
            !/^--nuwax-[a-z-]+$/.test(n.nodes[0].value) ||
            (n.nodes[0].value !== '--nuwax-background-image' &&
              !tokenNames.some(
                (k) => `--nuwax-${k.replaceAll('.', '-')}` === n.nodes[0].value,
              )))
        )
          fail(file, 'only semantic --nuwax token variables allowed');
      }
      if (
        n.type === 'word' &&
        /(?:expression|behavior|(?:https?|data|file):)/i.test(n.value)
      )
        fail(file, 'unsafe CSS value');
    });
    d.value = v.toString();
  });
  return ast.toString();
}
export function validateThemePackage(files) {
  object(files, 'files');
  const entries = Object.entries(files);
  if (entries.length > limits.files) fail('files', '500 file limit');
  const names = new Set(),
    prefixes = new Map(),
    bytes = {},
    copy = {};
  let total = 0;
  for (const [p, b] of entries) {
    canonicalPath(p);
    if (names.has(p.toLowerCase())) fail(p, 'case-colliding path');
    names.add(p.toLowerCase());
    const parts = p.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/'),
        key = prefix.toLowerCase(),
        kind = i === parts.length ? 'file' : 'directory',
        prior = prefixes.get(key);
      if (prior && (prior.path !== prefix || prior.kind !== kind))
        fail(p, 'case-colliding or file/directory path');
      prefixes.set(key, { path: prefix, kind });
    }
    if (!/\.(json|css|png|jpe?g|webp|woff2)$/.test(p) && p !== 'README.md')
      fail(p, 'unsupported file type');
    bytes[p] = decode(b, p);
    copy[p] = b;
    total += bytes[p].length;
    if (total > limits.totalBytes) fail(p, '20 MiB total limit');
    if (mimeFor(p)) binary(bytes[p], p);
    else if (p.endsWith('.json')) json(bytes[p], p);
    else utf(bytes[p], p);
  }
  if (!own(bytes, 'theme.json')) fail('theme.json', 'missing manifest');
  const m = json(bytes['theme.json'], 'theme.json');
  fields(
    m,
    [
      'schemaVersion',
      'id',
      'name',
      'version',
      'author',
      'description',
      'preview',
      'variants',
    ],
    'theme.json',
  );
  if (m.schemaVersion !== 1) fail('theme.json.schemaVersion', 'expected 1');
  if (
    typeof m.id !== 'string' ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(m.id) ||
    m.id.length > 80 ||
    ['constructor', 'prototype', '__proto__'].includes(m.id)
  )
    fail('theme.json.id', 'invalid slug');
  text(m.name, 'theme.json.name');
  text(m.version, 'theme.json.version', 80);
  for (const k of ['author', 'description'])
    if (own(m, k)) text(m[k], `theme.json.${k}`, 2000);
  if (own(m, 'preview')) {
    canonicalPath(m.preview, 'theme.json.preview');
    if (!own(bytes, m.preview) || !mimeFor(m.preview)?.startsWith('image/'))
      fail('theme.json.preview', 'missing image');
  }
  fields(m.variants, ['light', 'dark'], 'theme.json.variants');
  if (!Object.keys(m.variants).length)
    fail('theme.json.variants', 'at least one variant required');
  for (const [mode, v] of Object.entries(m.variants)) {
    const w = `theme.json.variants.${mode}`;
    fields(v, ['tokens', 'styles'], w);
    canonicalPath(v.tokens, w + '.tokens');
    if (!v.tokens.endsWith('.json') || !own(bytes, v.tokens))
      fail(w + '.tokens', 'missing JSON');
    tokens(json(bytes[v.tokens], v.tokens), v.tokens);
    if (own(v, 'styles')) {
      fields(v.styles, ['common', ...surfaces], w + '.styles');
      for (const [surface, paths] of Object.entries(v.styles)) {
        if (!Array.isArray(paths))
          fail(w + '.styles.' + surface, 'expected ordered array');
        for (const p of paths) {
          canonicalPath(p, w + '.styles.' + surface);
          if (!p.endsWith('.css') || !own(bytes, p))
            fail(w + '.styles.' + surface, `missing CSS ${p}`);
        }
      }
    }
  }
  // Validate even unreferenced styles so hidden malformed resources cannot be installed.
  for (const p of Object.keys(bytes))
    if (p.endsWith('.css')) css(utf(bytes[p], p), p, 'web', copy);
  return { manifest: m, files: copy };
}
export function resolveThemePackage(pkg, preference, systemDark, revision) {
  if (
    !['light', 'dark', 'system'].includes(preference) ||
    typeof systemDark !== 'boolean' ||
    !Number.isSafeInteger(revision) ||
    revision < 0
  )
    fail('resolve', 'invalid preference/systemDark/revision');
  const p = validateThemePackage(pkg.files),
    m = p.manifest;
  const wanted =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const mode = own(m.variants, wanted) ? wanted : Object.keys(m.variants)[0],
    v = m.variants[mode];
  const supplied = tokens(
    json(decode(p.files[v.tokens], v.tokens), v.tokens),
    v.tokens,
  );
  const t = {
      ...defaultTokens[mode],
      ...supplied,
      // Older packages already define their content material; keep the secondary
      // navigation in that palette instead of introducing an unrelated default.
      'sidebar.secondary.bg':
        supplied['sidebar.secondary.bg'] ??
        supplied['surface.bg'] ??
        defaultTokens[mode]['sidebar.secondary.bg'],
    },
    out = {},
    assets = {};
  for (const surface of surfaces)
    out[surface] = [...(v.styles?.common ?? []), ...(v.styles?.[surface] ?? [])]
      .map((path) =>
        css(utf(decode(p.files[path], path), path), path, surface, p.files),
      )
      .join('\n');
  for (const [path, base64] of Object.entries(p.files))
    if (mimeFor(path)) assets[path] = { mime: mimeFor(path), base64 };
  return {
    revision,
    themeId: m.id,
    name: m.name,
    mode,
    tokens: t,
    css: out,
    assets,
  };
}
export const officialThemeIds = Object.freeze([
  'nuwax-default',
  'deepseek-inspired',
]);
export function assertInstallableThemeId(id) {
  if (officialThemeIds.includes(id))
    fail('theme.json.id', 'official ID reserved; installer must not overwrite');
}
