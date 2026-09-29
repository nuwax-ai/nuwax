/** Vite dev ESM 读取真实 window，qiankun preamble 落沙箱；必须先于任何 JSX 模块导入。 */
declare global {
  interface Window {
    $RefreshReg$?: () => void;
    $RefreshSig$?: (type: unknown) => (type: unknown) => unknown;
  }
}

if (import.meta.env.DEV && typeof window.$RefreshSig$ === 'undefined') {
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type: unknown) => type;
}

export {};
