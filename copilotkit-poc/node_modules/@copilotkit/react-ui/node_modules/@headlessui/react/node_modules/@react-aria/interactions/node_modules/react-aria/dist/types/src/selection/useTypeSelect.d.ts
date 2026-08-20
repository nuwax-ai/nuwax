import { DOMAttributes, Key, KeyboardDelegate } from '@react-types/shared';
import { MultipleSelectionManager } from 'react-stately/useMultipleSelectionState';
export interface AriaTypeSelectOptions {
    /**
     * A delegate that returns collection item keys with respect to visual layout.
     */
    keyboardDelegate: KeyboardDelegate;
    /**
     * An interface for reading and updating multiple selection state.
     */
    selectionManager: MultipleSelectionManager;
    /**
     * Called when an item is focused by typing.
     */
    onTypeSelect?: (key: Key) => void;
}
export interface TypeSelectAria {
    /**
     * Props to be spread on the owner of the options.
     */
    typeSelectProps: DOMAttributes;
}
/**
 * Handles typeahead interactions with collections.
 */
export declare function useTypeSelect(options: AriaTypeSelectOptions): TypeSelectAria;
