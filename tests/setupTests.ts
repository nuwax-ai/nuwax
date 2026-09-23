import '@testing-library/jest-dom';

// jsdom 与 Node 的 TypedArray 来自不同 realm 时，esbuild 在测试模块中会因
// TextEncoder.encode 返回值无法通过当前 realm 的 instanceof 检查而拒绝启动。
if (!(new TextEncoder().encode('') instanceof Uint8Array)) {
  const OriginalTextEncoder = TextEncoder;
  globalThis.TextEncoder =
    class CompatibleTextEncoder extends OriginalTextEncoder {
      encode(input?: string): Uint8Array {
        return new Uint8Array(super.encode(input));
      }
    } as typeof TextEncoder;
}

// antd 响应式依赖 matchMedia，测试环境补齐
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-expect-error test env polyfill
  window.matchMedia = (query: string) => ({
    media: query,
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
