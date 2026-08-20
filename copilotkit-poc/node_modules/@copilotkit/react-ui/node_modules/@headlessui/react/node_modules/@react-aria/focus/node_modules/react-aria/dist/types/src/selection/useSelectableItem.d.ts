import { DOMAttributes, DOMProps, FocusableElement, Key, RefObject } from '@react-types/shared';
import { MultipleSelectionManager } from 'react-stately/useMultipleSelectionState';
export interface SelectableItemOptions extends DOMProps {
    /**
     * An interface for reading and updating multiple selection state.
     */
    selectionManager: MultipleSelectionManager;
    /**
     * A unique key for the item.
     */
    key: Key;
    /**
     * Ref to the item.
     */
    ref: RefObject<FocusableElement | null>;
    /**
     * By default, selection occurs on pointer down. This can be strange if selecting an
     * item causes the UI to disappear immediately (e.g. menus).
     */
    shouldSelectOnPressUp?: boolean;
    /**
     * Whether selection requires the pointer/mouse down and up events to occur on the same target or
     * triggers selection on the target of the pointer/mouse up event.
     */
    allowsDifferentPressOrigin?: boolean;
    /**
     * Whether the option is contained in a virtual scroller.
     */
    isVirtualized?: boolean;
    /**
     * Function to focus the item.
     */
    focus?: () => void;
    /**
     * Whether the option should use virtual focus instead of being focused directly.
     */
    shouldUseVirtualFocus?: boolean;
    /** Whether the item is disabled. */
    isDisabled?: boolean;
    /**
     * Handler that is called when a user performs an action on the item. The exact user event depends
     * on the collection's `selectionBehavior` prop and the interaction modality.
     */
    onAction?: () => void;
    /**
     * The behavior of links in the collection.
     * - 'action': link behaves like onAction.
     * - 'selection': link follows selection interactions (e.g. if URL drives selection).
     * - 'override': links override all other interactions (link items are not selectable).
     * - 'none': links are disabled for both selection and actions (e.g. handled elsewhere).
     *
     * @default 'action'
     */
    linkBehavior?: 'action' | 'selection' | 'override' | 'none';
}
export interface SelectableItemStates {
    /** Whether the item is currently in a pressed state. */
    isPressed: boolean;
    /** Whether the item is currently selected. */
    isSelected: boolean;
    /** Whether the item is currently focused. */
    isFocused: boolean;
    /**
     * Whether the item is non-interactive, i.e. both selection and actions are disabled and the item
     * may not be focused. Dependent on `disabledKeys` and `disabledBehavior`.
     */
    isDisabled: boolean;
    /**
     * Whether the item may be selected, dependent on `selectionMode`, `disabledKeys`, and
     * `disabledBehavior`.
     */
    allowsSelection: boolean;
    /**
     * Whether the item has an action, dependent on `onAction`, `disabledKeys`,
     * and `disabledBehavior`. It may also change depending on the current selection state
     * of the list (e.g. when selection is primary). This can be used to enable or disable hover
     * styles or other visual indications of interactivity.
     */
    hasAction: boolean;
}
export interface SelectableItemAria extends SelectableItemStates {
    /**
     * Props to be spread on the item root node.
     */
    itemProps: DOMAttributes;
}
/**
 * Handles interactions with an item in a selectable collection.
 */
export declare function useSelectableItem(options: SelectableItemOptions): SelectableItemAria;
