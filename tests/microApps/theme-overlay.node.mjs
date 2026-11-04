import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import postcss from 'postcss';
import { rewriteThemeColors } from '../../micro-frontends/shared/theme-colors.mjs';
import {
  adapterFingerprint,
  snapshotAdapter,
} from '../../scripts/sync-micro-apps.mjs';

test('theme color adaptation preserves resources, document colors and fallback values', () => {
  const root = postcss.parse(
    '.panel { color:#1f2329; background:#fff; border:1px solid #d9d9d9 } .image {background:url("/image#fff")} .ProseMirror {color:#1f2329}',
  );
  rewriteThemeColors(root);
  const result = root.toString();
  assert.match(result, /var\(--nuwax-text-primary, #1f2329\)/);
  assert.match(result, /var\(--nuwax-elevated-bg, #fff\)/);
  assert.match(
    result,
    /border:1px solid var\(--nuwax-border-default, #d9d9d9\)/,
  );
  assert.match(result, /url\("\/image#fff"\)/);
  assert.match(result, /\.ProseMirror \{color:#1f2329\}/);
});

test('shared overlay bytes enter cache keys and remain frozen in the build snapshot', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-overlay-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const overlay = path.join(root, 'overlay');
  await fs.mkdir(overlay);
  const adapterPath = path.join(root, 'adapter.json');
  const adapterContents = JSON.stringify({
    overlay: 'overlay',
    patch: 'adapter.patch',
  });
  await fs.writeFile(adapterPath, adapterContents);
  const patch = path.join(root, 'adapter.patch');
  await fs.writeFile(patch, 'patch');
  const source = path.join(root, 'shared.ts');
  await fs.writeFile(source, 'first');
  const app = {
    id: 'message',
    overlay,
    adapterPath,
    adapterContents,
    patch,
    adapter: { overlay: 'overlay', patch: 'adapter.patch' },
    sharedOverlay: [{ target: 'src/themeRuntime.ts', source }],
  };
  const before = await adapterFingerprint(app);
  const { snapshot } = await snapshotAdapter(app, path.join(root, 'snapshot'));
  await fs.writeFile(source, 'changed');
  assert.notEqual((await adapterFingerprint(app)).sha256, before.sha256);
  assert.equal((await adapterFingerprint(snapshot)).sha256, before.sha256);
  assert.equal(
    await fs.readFile(snapshot.sharedOverlay[0].source, 'utf8'),
    'first',
  );
});

test('upstream gray palette and rgb surfaces use theme tokens without changing status or content colors', () => {
  const root = postcss.parse(
    '.tree {color:#1d2129; background:rgb(252, 252, 252); border:1px solid #e5e6eb} .meta {color:#4e5969} .tool {color:#4c4c4c} .label {color:rgba(0,0,0,.65)} .error {color:#cf1322} .ProseMirror {color:#1d2129} .hljs-string {color:#4e5969} .mask {background:rgba(0,0,0,.5)}',
  );
  rewriteThemeColors(root);
  const css = root.toString();
  assert.match(css, /color:var\(--nuwax-text-primary, #1d2129\)/);
  assert.match(
    css,
    /background:var\(--nuwax-elevated-bg, rgb\(252, 252, 252\)\)/,
  );
  assert.match(css, /border:1px solid var\(--nuwax-border-default, #e5e6eb\)/);
  assert.match(css, /var\(--nuwax-text-secondary, #4e5969\)/);
  assert.match(css, /var\(--nuwax-text-secondary, #4c4c4c\)/);
  assert.match(css, /var\(--nuwax-text-secondary, rgba\(0,0,0,.65\)\)/);
  assert.match(css, /\.error \{color:#cf1322\}/);
  assert.match(css, /\.ProseMirror \{color:#1d2129\}/);
  assert.match(css, /\.hljs-string \{color:#4e5969\}/);
  assert.match(css, /\.mask \{background:rgba\(0,0,0,.5\)\}/);
});
