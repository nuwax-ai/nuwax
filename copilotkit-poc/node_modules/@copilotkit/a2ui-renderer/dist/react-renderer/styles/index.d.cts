//#region src/react-renderer/styles/index.d.ts
/**
 * Injects A2UI structural styles into the document head.
 * Includes utility classes and React-specific overrides.
 * CSS variables (palette) must be defined by the host on :root.
 */
declare function injectStyles(): void;
/**
 * Removes the injected A2UI structural styles from the document.
 */
declare function removeStyles(): void;
//#endregion
export { injectStyles, removeStyles };
//# sourceMappingURL=index.d.cts.map