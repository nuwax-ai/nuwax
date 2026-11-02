import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import postcss from 'postcss';
import { rewriteThemeColors } from '../../micro-frontends/shared/theme-colors.mjs';
import { adapterFingerprint, snapshotAdapter } from '../../scripts/sync-micro-apps.mjs';

test('theme color adaptation preserves resources, document colors and fallback values', () => {
  const root = postcss.parse('.panel { color:#1f2329; background:#fff; border:1px solid #d9d9d9 } .image {background:url("/image#fff")} .ProseMirror {color:#1f2329}');
  rewriteThemeColors(root);
  const result = root.toString();
  assert.match(result, /var\(--nuwax-text-primary, #1f2329\)/);
  assert.match(result, /var\(--nuwax-elevated-bg, #fff\)/);
  assert.match(result, /border:1px solid var\(--nuwax-border-default, #d9d9d9\)/);
  assert.match(result, /url\("\/image#fff"\)/);
  assert.match(result, /\.ProseMirror \{color:#1f2329\}/);
});

test('shared overlay bytes enter cache keys and remain frozen in the build snapshot', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'theme-overlay-'));
  t.after(() => fs.rm(root, {recursive: true, force: true}));
  const overlay = path.join(root, 'overlay'); await fs.mkdir(overlay);
  const adapterPath = path.join(root, 'adapter.json');
  const adapterContents = JSON.stringify({overlay: 'overlay', patch: 'adapter.patch'});
  await fs.writeFile(adapterPath, adapterContents);
  const patch = path.join(root, 'adapter.patch'); await fs.writeFile(patch, 'patch');
  const source = path.join(root, 'shared.ts'); await fs.writeFile(source, 'first');
  const app = {id:'message', overlay, adapterPath, adapterContents, patch,
    adapter: {overlay:'overlay', patch:'adapter.patch'}, sharedOverlay: [{target:'src/themeRuntime.ts', source}]};
  const before = await adapterFingerprint(app);
  const {snapshot} = await snapshotAdapter(app, path.join(root, 'snapshot'));
  await fs.writeFile(source, 'changed');
  assert.notEqual((await adapterFingerprint(app)).sha256, before.sha256);
  assert.equal((await adapterFingerprint(snapshot)).sha256, before.sha256);
  assert.equal(await fs.readFile(snapshot.sharedOverlay[0].source, 'utf8'), 'first');
});
