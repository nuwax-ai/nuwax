import { FocusableElement } from '@react-types/shared';
import { FocusEvent as ReactFocusEvent, SyntheticEvent } from 'react';
export declare function createSyntheticEvent<E extends SyntheticEvent>(nativeEvent: Event): E;
export declare function setEventTarget(event: Event, target: Element): void;
export declare function useSyntheticBlurEvent<Target extends Element = Element>(onBlur: (e: ReactFocusEvent<Target>) => void): (e: ReactFocusEvent<Target>) => void;
export declare let ignoreFocusEvent: boolean;
/**
 * This function prevents the next focus event fired on `target`, without using
 * `event.preventDefault()`. It works by waiting for the series of focus events to occur, and
 * reverts focus back to where it was before. It also makes these events mostly non-observable by
 * using a capturing listener on the window and stopping propagation.
 */
export declare function preventFocus(target: FocusableElement | null): (() => void) | undefined;
