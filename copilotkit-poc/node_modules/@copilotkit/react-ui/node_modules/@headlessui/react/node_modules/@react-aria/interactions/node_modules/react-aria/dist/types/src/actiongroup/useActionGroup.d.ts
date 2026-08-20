import { AriaLabelingProps, DOMAttributes, DOMProps, FocusableElement, ItemElement, ItemRenderer, Key, MultipleSelection, Orientation, RefObject } from '@react-types/shared';
import { ListState } from 'react-stately/useListState';
export interface ActionGroupProps<T> extends MultipleSelection {
    /**
     * The axis the ActionGroup should align with.
     *
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * An list of `Item` elements or a function. If the latter, a list of items must be provided using
     * the `items` prop.
     */
    children: ItemElement<T> | ItemElement<T>[] | ItemRenderer<T>;
    /** A list of items to display as children. Must be used with a function as the sole child. */
    items?: Iterable<T>;
    /** A list of keys to disable. */
    disabledKeys?: Iterable<Key>;
    /**
     * Whether the ActionGroup is disabled.
     * Shows that a selection exists, but is not available in that circumstance.
     */
    isDisabled?: boolean;
    /**
     * Invoked when an action is taken on a child. Especially useful when `selectionMode` is none.
     * The sole argument `key` is the key for the item.
     */
    onAction?: (key: Key) => void;
}
export interface AriaActionGroupProps<T> extends ActionGroupProps<T>, DOMProps, AriaLabelingProps {
}
export interface ActionGroupAria {
    actionGroupProps: DOMAttributes;
}
export declare function useActionGroup<T>(props: AriaActionGroupProps<T>, state: ListState<T>, ref: RefObject<FocusableElement | null>): ActionGroupAria;
