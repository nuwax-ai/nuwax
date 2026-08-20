import { FocusableElement } from '@react-types/shared';
/**
 * A utility function that focuses an element while avoiding undesired side effects such
 * as page scrolling and screen reader issues with CSS transitions.
 */
export declare function focusSafely(element: FocusableElement): void;
