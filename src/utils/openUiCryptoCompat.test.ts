import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const compatSource = fs.readFileSync(
  path.resolve(process.cwd(), 'public/static/openui-crypto-compat.js'),
  'utf8',
);

function runCompat(cryptoObject?: Record<string, unknown>) {
  const context = vm.createContext({
    crypto: cryptoObject,
    Math,
    Uint8Array,
  });
  vm.runInContext(compatSource, context);
  return context.crypto as { randomUUID?: () => string };
}

describe('openui crypto compatibility', () => {
  it('keeps a native randomUUID implementation', () => {
    const nativeRandomUuid = vi.fn(() => 'native');
    const cryptoObject = runCompat({ randomUUID: nativeRandomUuid });

    expect(cryptoObject.randomUUID?.()).toBe('native');
    expect(nativeRandomUuid).toHaveBeenCalledOnce();
  });

  it('installs an RFC 4122 v4 UUID using getRandomValues', () => {
    const cryptoObject = runCompat({
      getRandomValues(bytes: Uint8Array) {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = i;
        return bytes;
      },
    });

    expect(cryptoObject.randomUUID?.()).toBe(
      '00010203-0405-4607-8809-0a0b0c0d0e0f',
    );
  });

  it('falls back when the WebView exposes no crypto object', () => {
    const cryptoObject = runCompat();
    const uuid = cryptoObject.randomUUID?.() || '';

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
});
