type Revert = () => void;
/**
 * Acts as a polyfill for `aria-modal` by watching for added modals and hiding any surrounding DOM
 * elements with `aria-hidden`.
 */
export declare function watchModals(selector?: string, { document }?: {
    document?: Document;
}): Revert;
export {};
