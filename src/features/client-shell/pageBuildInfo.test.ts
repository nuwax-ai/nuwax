import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeGitHash, readPageBuildInfo } from './pageBuildInfo';

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
    const { getPageBuildInfo } = await import('./pageBuildInfo');
    meta.content = 'bbbbbbb';
    expect(getPageBuildInfo().gitHash).toBe('aaaaaaa');
  });
});
