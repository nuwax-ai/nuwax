import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  normalizeBuildAt,
  normalizeGitHash,
  readPageBuildInfo,
} from './pageBuildInfo';

function markerDoc(hash = 'a1b2c3d', version = '1.2.0'): Document {
  const doc = document.implementation.createHTMLDocument();
  doc.head.innerHTML = `<meta name="nuwax-build-git-hash" content="${hash}"><meta name="nuwax-build-version" content="${version}">`;
  return doc;
}

describe('page build markers', () => {
  it('reads and freezes valid page metadata', () => {
    const doc = markerDoc(' A1B2C3D ', ' 1.2.0 ');
    const metadata = readPageBuildInfo(doc);
    doc.querySelector('meta')!.setAttribute('content', 'bbbbbbb');
    expect(metadata).toEqual({ gitHash: 'a1b2c3d', appVersion: '1.2.0' });
    expect(Object.isFrozen(metadata)).toBe(true);
  });

  it('leaves unknown or absent hashes unknown', () => {
    expect(readPageBuildInfo(markerDoc('unknown', ''))).toEqual({
      gitHash: undefined,
      appVersion: undefined,
    });
    expect(
      readPageBuildInfo(document.implementation.createHTMLDocument()),
    ).toEqual({
      gitHash: undefined,
      appVersion: undefined,
    });
  });

  it('reads the actual HTML build time and keeps older pages without a time marker compatible', () => {
    const doc = markerDoc();
    const meta = doc.createElement('meta');
    meta.name = 'nuwax-build-at';
    meta.content = '2026-10-09T22:40:34.791+08:00';
    doc.head.appendChild(meta);
    expect(readPageBuildInfo(doc).buildAt).toBe('2026-10-09T14:40:34.791Z');
    meta.content = 'not-a-date';
    expect(readPageBuildInfo(doc).buildAt).toBeUndefined();
    meta.remove();
    expect(readPageBuildInfo(doc).buildAt).toBeUndefined();
  });

  it.each([null, 123, '', '2026-10-09', 'invalid', '2026-13-09T14:40:34Z'])(
    'rejects invalid build time %s',
    (value) => expect(normalizeBuildAt(value)).toBeUndefined(),
  );

  it.each([null, '', 'abc', 'abcdefg', 1234567, '<html>', 'f'.repeat(65)])(
    'rejects invalid hash %s',
    (hash) => expect(normalizeGitHash(hash)).toBeUndefined(),
  );
});

describe('initial document metadata snapshot', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    document
      .querySelectorAll('meta[name^="nuwax-build-"]')
      .forEach((meta) => meta.remove());
  });

  it('keeps the initial document hash after later marker changes', async () => {
    const meta = document.createElement('meta');
    meta.name = 'nuwax-build-git-hash';
    meta.content = 'aaaaaaa';
    document.head.appendChild(meta);
    const time = document.createElement('meta');
    time.name = 'nuwax-build-at';
    time.content = '2026-10-09T14:40:34.791Z';
    document.head.appendChild(time);
    const { getPageBuildInfo } = await import('./pageBuildInfo');
    meta.content = 'bbbbbbb';
    time.content = '2026-10-10T14:40:34.791Z';
    expect(getPageBuildInfo().gitHash).toBe('aaaaaaa');
    expect(getPageBuildInfo().buildAt).toBe('2026-10-09T14:40:34.791Z');
  });
});
