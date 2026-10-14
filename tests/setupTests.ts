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

// Node 25+ 内置的全局 localStorage 在未提供 --localstorage-file 时是残缺对象（无 clear 等方法），
// 会盖住 jsdom 的实现；仅在检测到残缺时补内存实现，其他 Node 版本零影响。
for (const name of ['localStorage', 'sessionStorage'] as const) {
  let current: Storage | undefined;
  try {
    current = globalThis[name];
  } catch {
    current = undefined;
  }
  if (current && typeof current.clear === 'function') continue;
  const store = new Map<string, string>();
  const polyfill = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
  };
  Object.defineProperty(globalThis, name, {
    value: polyfill,
    configurable: true,
    writable: true,
  });
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
