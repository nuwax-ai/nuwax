export declare const getOwnerDocument: (el: Element | null | undefined) => Document;
export declare const getOwnerWindow: (el: Element | (Window & typeof globalThis) | null | undefined) => Window & typeof globalThis;
/**
 * Type guard that checks if a node is a ShadowRoot. Uses nodeType and host property checks to
 * distinguish ShadowRoot from other DocumentFragments.
 */
export declare function isShadowRoot(node: Node | null): node is ShadowRoot;
