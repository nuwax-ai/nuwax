import '@testing-library/jest-dom';

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
