import { Key } from '@react-types/shared';
export interface ToggleGroupProps {
    /**
     * Whether single or multiple selection is enabled.
     *
     * @default 'single'
     */
    selectionMode?: 'single' | 'multiple';
    /** Whether the collection allows empty selection. */
    disallowEmptySelection?: boolean;
    /** The currently selected keys in the collection (controlled). */
    selectedKeys?: Iterable<Key>;
    /** The initial selected keys in the collection (uncontrolled). */
    defaultSelectedKeys?: Iterable<Key>;
    /** Handler that is called when the selection changes. */
    onSelectionChange?: (keys: Set<Key>) => void;
    /** Whether all items are disabled. */
    isDisabled?: boolean;
}
export interface ToggleGroupState {
    /** Whether single or multiple selection is enabled. */
    readonly selectionMode: 'single' | 'multiple';
    /** Whether all items are disabled. */
    readonly isDisabled: boolean;
    /** A set of keys for items that are selected. */
    readonly selectedKeys: Set<Key>;
    /** Toggles the selected state for an item by its key. */
    toggleKey(key: Key): void;
    /** Sets whether the given key is selected. */
    setSelected(key: Key, isSelected: boolean): void;
    /** Replaces the set of selected keys. */
    setSelectedKeys(keys: Set<Key>): void;
}
/**
 * Manages state for a group of toggles.
 * It supports both single and multiple selected items.
 */
export declare function useToggleGroupState(props: ToggleGroupProps): ToggleGroupState;
