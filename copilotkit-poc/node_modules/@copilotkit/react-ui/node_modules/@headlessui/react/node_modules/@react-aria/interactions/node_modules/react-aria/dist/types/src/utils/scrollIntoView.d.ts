interface ScrollIntoViewOpts {
    /** The position to align items along the block axis in. */
    block?: ScrollLogicalPosition;
    /** The position to align items along the inline axis in. */
    inline?: ScrollLogicalPosition;
}
interface ScrollIntoViewportOpts {
    /** The optional containing element of the target to be centered in the viewport. */
    containingElement?: Element | null;
}
/**
 * Scrolls `scrollView` so that `element` is visible.
 * Similar to `element.scrollIntoView({block: 'nearest'})` (not supported in Edge),
 * but doesn't affect parents above `scrollView`.
 */
export declare function scrollIntoView(scrollView: HTMLElement, element: HTMLElement, opts?: ScrollIntoViewOpts): void;
/**
 * Scrolls the `targetElement` so it is visible in the viewport. Accepts an optional
 * `opts.containingElement` that will be centered in the viewport prior to scrolling the
 * targetElement into view. If scrolling is prevented on the body (e.g. targetElement is in a
 * popover), this will only scroll the scroll parents of the targetElement up to but not including
 * the body itself.
 */
export declare function scrollIntoViewport(targetElement: Element | null, opts?: ScrollIntoViewportOpts): void;
export {};
