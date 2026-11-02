import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { readThemeZip, writeThemeZip } from './archive';
import { officialThemePackage } from './core';

const buffer = (zip: JSZip) =>
  zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
describe('theme ZIP boundary', () => {
  it('round trips validated files and accepts one wrapping folder', async () => {
    const blob = await writeThemeZip(officialThemePackage.files);
    expect(await readThemeZip(blob)).toEqual(officialThemePackage.files);
    const zip = new JSZip();
    for (const [path, data] of Object.entries(officialThemePackage.files))
      zip.file(`wrapped/${path}`, data, { base64: true, createFolders: false });
    zip.file('__MACOSX/.DS_Store', 'metadata', { createFolders: false });
    expect(await readThemeZip(await buffer(zip))).toEqual(
      officialThemePackage.files,
    );
  });
  it.each([
    '../theme.json',
    '/theme.json',
    'a\\theme.json',
    'a/../../theme.json',
  ])('rejects original unsafe name %s', async (name) => {
    const zip = new JSZip();
    zip.file(name, '{}', { createFolders: false });
    await expect(readThemeZip(await buffer(zip))).rejects.toThrow();
  });
  it('rejects symlinks, case collisions and declared decompression bombs', async () => {
    const symlink = new JSZip();
    symlink.file('theme.json', 'target', { unixPermissions: 0o120777 });
    const linkBytes = await symlink.generateAsync({
      type: 'arraybuffer',
      platform: 'UNIX',
    });
    await expect(readThemeZip(linkBytes)).rejects.toThrow();
    const collision = new JSZip();
    collision.file('theme.json', '{}');
    collision.file('THEME.JSON', '{}');
    await expect(readThemeZip(await buffer(collision))).rejects.toThrow();
    const bomb = new JSZip();
    bomb.file('theme.json', 'x'.repeat(5 * 1024 * 1024 + 1));
    await expect(readThemeZip(await buffer(bomb))).rejects.toThrow();
  });
  it('bounds actual inflation even when metadata lies, and rejects truncation/encryption', async () => {
    const zip = new JSZip();
    zip.file('theme.json', 'x'.repeat(100000));
    const bytes = new Uint8Array(await buffer(zip));
    const view = new DataView(bytes.buffer);
    const central = bytes.findIndex(
      (_, i) => i + 4 <= bytes.length && view.getUint32(i, true) === 0x02014b50,
    );
    view.setUint32(22, 1, true);
    view.setUint32(central + 24, 1, true);
    await expect(readThemeZip(bytes.buffer)).rejects.toThrow('inflation limit');
    await expect(readThemeZip(bytes.slice(0, -1).buffer)).rejects.toThrow();
    view.setUint16(6, 1, true);
    view.setUint16(central + 8, 1, true);
    await expect(readThemeZip(bytes.buffer)).rejects.toThrow();
  });
});

it('rejects duplicate original entries, ZIP64 metadata and multidisk headers', async () => {
  const zip = new JSZip();
  zip.file('theme.json', '{}');
  zip.file('xheme.json', '{}');
  const bytes = new Uint8Array(await buffer(zip));
  // Rename both original local and central names to collide; JSZip would otherwise overwrite one.
  for (let i = 0; i < bytes.length - 10; i++) {
    if (String.fromCharCode(...bytes.subarray(i, i + 10)) === 'xheme.json')
      bytes[i] = 't'.charCodeAt(0);
  }
  await expect(readThemeZip(bytes.buffer)).rejects.toThrow();
  const valid = new Uint8Array(
    await buffer(new JSZip().file('theme.json', '{}')),
  );
  const view = new DataView(valid.buffer),
    end = valid.length - 22;
  view.setUint16(end + 4, 1, true);
  await expect(readThemeZip(valid.buffer)).rejects.toThrow();
  view.setUint16(end + 4, 0, true);
  view.setUint32(end + 16, 0xffffffff, true);
  await expect(readThemeZip(valid.buffer)).rejects.toThrow();
});
