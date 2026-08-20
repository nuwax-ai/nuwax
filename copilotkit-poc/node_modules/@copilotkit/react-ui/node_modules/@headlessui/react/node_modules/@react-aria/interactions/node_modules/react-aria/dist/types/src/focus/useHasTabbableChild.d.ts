import { RefObject } from '@react-types/shared';
interface AriaHasTabbableChildOptions {
    isDisabled?: boolean;
}
/**
 * Returns whether an element has a tabbable child, and updates as children change.
 *
 * @private
 */
export declare function useHasTabbableChild(ref: RefObject<Element | null>, options?: AriaHasTabbableChildOptions): boolean;
export {};
