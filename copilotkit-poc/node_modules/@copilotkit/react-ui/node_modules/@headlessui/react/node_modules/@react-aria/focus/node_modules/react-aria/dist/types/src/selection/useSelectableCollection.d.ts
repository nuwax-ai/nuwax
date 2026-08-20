import { DOMAttributes, FocusStrategy, KeyboardDelegate, RefObject } from '@react-types/shared';
import { MultipleSelectionManager } from 'react-stately/useMultipleSelectionState';
export interface AriaSelectableCollectionOptions {
    /**
     * An interface for reading and updating multiple selection state.
     */
    selectionManager: MultipleSelectionManager;
    /**
     * A delegate object that implements behavior for keyboard focus movement.
     */
    keyboardDelegate: KeyboardDelegate;
    /**
     * The ref attached to the element representing the collection.
     */
    ref: RefObject<HTMLElement | null>;
    /**
     * Whether the collection or one of its items should be automatically focused upon render.
     *
     * @default false
     */
    autoFocus?: boolean | FocusStrategy;
    /**
     * Whether focus should wrap around when the end/start is reached.
     *
     * @default false
     */
    shouldFocusWrap?: boolean;
    /**
     * Whether the collection allows empty selection.
     *
     * @default false
     */
    disallowEmptySelection?: boolean;
    /**
     * Whether the collection allows the user to select all items via keyboard shortcut.
     *
     * @default false
     */
    disallowSelectAll?: boolean;
    /**
     * Whether pressing the Escape should clear selection in the collection or not.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
    /**
     * Whether selection should occur automatically on focus.
     *
     * @default false
     */
    selectOnFocus?: boolean;
    /**
     * Whether typeahead is disabled.
     *
     * @default false
     */
    disallowTypeAhead?: boolean;
    /**
     * Whether the collection items should use virtual focus instead of being focused directly.
     */
    shouldUseVirtualFocus?: boolean;
    /**
     * Whether navigation through tab key is enabled.
     */
    allowsTabNavigation?: boolean;
    /**
     * Whether the collection items are contained in a virtual scroller.
     */
    isVirtualized?: boolean;
    /**
     * The ref attached to the scrollable body. Used to provide automatic scrolling on item focus for
     * non-virtualized collections. If not provided, defaults to the collection ref.
     */
    scrollRef?: RefObject<HTMLElement | null>;
    /**
     * The behavior of links in the collection.
     * - 'action': link behaves like onAction.
     * - 'selection': link follows selection interactions (e.g. if URL drives selection).
     * - 'override': links override all other interactions (link items are not selectable).
     *
     * @default 'action'
     */
    linkBehavior?: 'action' | 'selection' | 'override';
}
export interface SelectableCollectionAria {
    /** Props for the collection element. */
    collectionProps: DOMAttributes;
}
/**
 * Handles interactions with selectable collections.
 */
export declare function useSelectableCollection(options: AriaSelectableCollectionOptions): SelectableCollectionAria;
