import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  withBuildMetadata,
  writeDistVersion,
} = require('../scripts/write-dist-version.js');
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-version-'));
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));
const buildAt = '2026-10-09T00:00:00.000Z';

const fixture = (name) => {
  const root = path.join(tmpRoot, name);
  const distDir = path.join(root, 'dist');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'nuwax-frontend', version: '1.2.0' }),
  );
  fs.writeFileSync(
    path.join(distDir, 'index.html'),
    '<!doctype html><html><head><meta charset="utf-8"></head><body><script src="umi.aabbccdd.js"></script></body></html>',
  );
  fs.writeFileSync(
    path.join(distDir, 'umi.aabbccdd.js'),
    'unchanged-business-js',
  );
  return { root, distDir, buildAt };
};

describe('构建版本元信息', () => {
  it.each([
    '<head><script>window.entryRunsImmediately = true;</script></head>',
    '<head>\n<meta charset="utf-8">\n<script src="umi.aabbccdd.js"></script></head>',
  ])('构建标记早于 head 内的同步入口脚本：%s', (head) => {
    const html = withBuildMetadata(`<html>${head}<body></body></html>`, {
      version: '1.2.0',
      gitHash: 'aaaaaaaa',
      buildAt,
    });
    expect(html.indexOf('nuwax-build-version')).toBeLessThan(
      html.indexOf('<script'),
    );
    expect(html.indexOf('nuwax-build-git-hash')).toBeLessThan(
      html.indexOf('<script'),
    );
    expect(html.indexOf('nuwax-build-at')).toBeLessThan(
      html.indexOf('<script'),
    );
    if (html.includes('charset')) {
      expect(html.indexOf('charset')).toBeLessThan(
        html.indexOf('nuwax-build-version'),
      );
    }
    expect(
      withBuildMetadata(html, {
        version: '1.2.0',
        gitHash: 'aaaaaaaa',
        buildAt,
      }),
    ).toBe(html);
  });
  it('同一 payload 写入 HTML 与 version.json，不改变业务 JS', () => {
    const options = fixture('consistent');
    const payload = writeDistVersion({
      ...options,
      resolveGitHash: () => '4dfea90cd2',
    });
    expect(
      JSON.parse(
        fs.readFileSync(path.join(options.distDir, 'version.json'), 'utf8'),
      ),
    ).toEqual(payload);
    const html = fs.readFileSync(
      path.join(options.distDir, 'index.html'),
      'utf8',
    );
    expect(html).toContain(
      '<meta name="nuwax-build-git-hash" content="4dfea90cd2">',
    );
    expect(html).toContain('<meta name="nuwax-build-version" content="1.2.0">');
    expect(html).toContain(
      `<meta name="nuwax-build-at" content="${payload.buildAt}">`,
    );
    expect(html).toContain('<meta charset="utf-8">');
    expect(
      fs.readFileSync(path.join(options.distDir, 'umi.aabbccdd.js'), 'utf8'),
    ).toBe('unchanged-business-js');
  });

  it('重跑保持幂等，下一次构建只留下新元标记', () => {
    const options = fixture('rerun');
    writeDistVersion({ ...options, resolveGitHash: () => '11111111' });
    const firstHtml = fs.readFileSync(
      path.join(options.distDir, 'index.html'),
      'utf8',
    );
    writeDistVersion({ ...options, resolveGitHash: () => '11111111' });
    expect(
      fs.readFileSync(path.join(options.distDir, 'index.html'), 'utf8'),
    ).toBe(firstHtml);
    const nextBuildAt = '2026-10-10T00:00:00.000Z';
    const nextPayload = writeDistVersion({
      ...options,
      buildAt: nextBuildAt,
      resolveGitHash: () => '22222222',
    });
    const html = fs.readFileSync(
      path.join(options.distDir, 'index.html'),
      'utf8',
    );
    expect(html.match(/name="nuwax-build-git-hash"/g)).toHaveLength(1);
    expect(html.match(/name="nuwax-build-version"/g)).toHaveLength(1);
    expect(html.match(/name="nuwax-build-at"/g)).toHaveLength(1);
    expect(html).toContain(`content="${nextBuildAt}"`);
    expect(html).not.toContain(buildAt);
    expect(
      JSON.parse(
        fs.readFileSync(path.join(options.distDir, 'version.json'), 'utf8'),
      ).buildAt,
    ).toBe(nextPayload.buildAt);
    expect(html).toContain('content="22222222"');
    expect(html).not.toContain('11111111');
  });

  it.each(['', 'not-a-git-hash', null])(
    '缺少有效 hash (%s) 时不伪造，并移除旧标记',
    (hash) => {
      const options = fixture(`missing-${hash}`);
      writeDistVersion({ ...options, resolveGitHash: () => '11111111' });
      const payload = writeDistVersion({
        ...options,
        resolveGitHash: () => hash,
      });
      expect(payload).not.toHaveProperty('gitHash');
      expect(
        fs.readFileSync(path.join(options.distDir, 'index.html'), 'utf8'),
      ).not.toContain('nuwax-build-git-hash');
      expect(
        JSON.parse(
          fs.readFileSync(path.join(options.distDir, 'version.json'), 'utf8'),
        ),
      ).not.toHaveProperty('gitHash');
    },
  );

  it('Git 命令不可用时仍写版本而不留过期 hash', () => {
    const options = fixture('no-git');
    const payload = writeDistVersion({
      ...options,
      resolveGitHash: () => {
        throw new Error('not a git repo');
      },
    });
    expect(payload.version).toBe('1.2.0');
    expect(payload).not.toHaveProperty('gitHash');
  });

  it('转义版本号，识别单双引号与属性顺序不同的旧标记', () => {
    const html = withBuildMetadata(
      '<html><head><meta content="old" name=\'nuwax-build-git-hash\'><meta name="nuwax-build-version" content="old"></head></html>',
      { version: '1.2.0"&<>\'', gitHash: 'aaaaaaaa' },
    );
    expect(html).toContain('content="1.2.0&quot;&amp;&lt;&gt;&#39;"');
    expect(html).not.toContain('old');
    expect(html.match(/nuwax-build-git-hash/g)).toHaveLength(1);
  });

  it('构建时间沿用属性转义标准，并清除所有旧时间标记', () => {
    const html = withBuildMetadata(
      '<html><head><meta content="old-time" name=\'nuwax-build-at\'><meta name="nuwax-build-at" content="another-old-time"><script src="umi.aabbccdd.js"></script></head></html>',
      { version: '1.2.0', buildAt: '2026-10-09T00:00:00.000Z"&<>\'' },
    );
    expect(html).toContain(
      'content="2026-10-09T00:00:00.000Z&quot;&amp;&lt;&gt;&#39;"',
    );
    expect(html.match(/name="nuwax-build-at"/g)).toHaveLength(1);
    expect(html).not.toContain('old-time');
    expect(html.indexOf('nuwax-build-at')).toBeLessThan(
      html.indexOf('<script'),
    );
  });

  it('缺少入口 head 时失败，避免 version.json 单独更新', () => {
    const options = fixture('invalid-html');
    fs.writeFileSync(
      path.join(options.distDir, 'index.html'),
      '<html><body></body></html>',
    );
    expect(() =>
      writeDistVersion({ ...options, resolveGitHash: () => 'aaaaaaaa' }),
    ).toThrow('缺少 head');
    expect(fs.existsSync(path.join(options.distDir, 'version.json'))).toBe(
      false,
    );
  });
});
