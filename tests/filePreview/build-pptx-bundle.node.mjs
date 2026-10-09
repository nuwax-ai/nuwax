import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { buildFilePreviewPptx } from '../../scripts/build-file-preview-pptx.mjs';

test('共享静态 PPTX bundle 与源码一致，仅消费 patched main 和浏览器依赖', async () => {
  const { contents, inputs, outputPath } = await buildFilePreviewPptx();
  assert.deepEqual(await readFile(outputPath), Buffer.from(contents));
  assert.ok(inputs.some((input) => input.endsWith('/dist/preview-owner.js')));
  assert.ok(inputs.some((input) => input.endsWith('/dist/pptx-preview.es.js')));
  assert.ok(!inputs.some((input) => input.includes('pptx-preview.umd')));
  assert.ok(
    !inputs.some((input) =>
      /(?:^|\/)(?:react|react-dom|umi|@umijs)(?:\/|$)/.test(input),
    ),
  );
});
