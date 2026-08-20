interface PreventScrollOptions {
    /** Whether the scroll lock is disabled. */
    isDisabled?: boolean;
}
/**
 * Prevents scrolling on the document body on mount, and
 * restores it on unmount. Also ensures that content does not
 * shift due to the scrollbars disappearing.
 */
export declare function usePreventScroll(options?: PreventScrollOptions): void;
export {};
