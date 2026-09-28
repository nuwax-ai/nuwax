/** Vite dev ESM 读真实 window；宿主沙箱 preamble 在代理上，先给 refresh 补桩。 */
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
