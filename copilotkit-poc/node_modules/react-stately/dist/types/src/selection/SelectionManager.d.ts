import { Collection, DisabledBehavior, FocusStrategy, Selection as ISelection, Key, LayoutDelegate, LongPressEvent, Node, PressEvent, SelectionBehavior, SelectionMode } from '@react-types/shared';
import { MultipleSelectionManager, MultipleSelectionState } from './types';
interface SelectionManagerOptions {
    allowsCellSelection?: boolean;
    layoutDelegate?: LayoutDelegate;
    fullCollection?: Collection<Node<unknown>>;
}
/**
 * An interface for reading and updating multiple selection state.
 */
export declare class SelectionManager implements MultipleSelectionManager {
    collection: Collection<Node<unknown>>;
    private state;
    private allowsCellSelection;
    private _isSelectAll;
    private layoutDelegate;
    private fullCollection;
    constructor(collection: Collection<Node<unknown>>, state: MultipleSelectionState, options?: SelectionManagerOptions);
    /**
     * The type of selection that is allowed in the collection.
     */
    get selectionMode(): SelectionMode;
    /**
     * Whether the collection allows empty selection.
     */
    get disallowEmptySelection(): boolean;
    /**
     * The selection behavior for the collection.
     */
    get selectionBehavior(): SelectionBehavior;
    /**
     * Sets the selection behavior for the collection.
     */
    setSelectionBehavior(selectionBehavior: SelectionBehavior): void;
    /**
     * Whether the collection is currently focused.
     */
    get isFocused(): boolean;
    /**
     * Sets whether the collection is focused.
     */
    setFocused(isFocused: boolean): void;
    /**
     * The current focused key in the collection.
     */
    get focusedKey(): Key | null;
    /** Whether the first or last child of the focused key should receive focus. */
    get childFocusStrategy(): FocusStrategy | null;
    /**
     * Sets the focused key.
     */
    setFocusedKey(key: Key | null, childFocusStrategy?: FocusStrategy): void;
    /**
     * The currently selected keys in the collection.
     */
    get selectedKeys(): Set<Key>;
    /**
     * The raw selection value for the collection.
     * Either 'all' for select all, or a set of keys.
     */
    get rawSelection(): ISelection;
    /**
     * Returns whether a key is selected.
     */
    isSelected(key: Key): boolean;
    /**
     * Whether the selection is empty.
     */
    get isEmpty(): boolean;
    /**
     * Whether all items in the collection are selected.
     */
    get isSelectAll(): boolean;
    get firstSelectedKey(): Key | null;
    get lastSelectedKey(): Key | null;
    get disabledKeys(): Set<Key>;
    get disabledBehavior(): DisabledBehavior;
    /**
     * Extends the selection to the given key.
     */
    extendSelection(toKey: Key): void;
    private getKeyRange;
    private getKeyRangeInternal;
    private getKey;
    /**
     * Toggles whether the given key is selected.
     */
    toggleSelection(key: Key): void;
    /**
     * Replaces the selection with only the given key.
     */
    replaceSelection(key: Key): void;
    /**
     * Replaces the selection with the given keys.
     */
    setSelectedKeys(keys: Iterable<Key>): void;
    private getSelectAllKeys;
    /**
     * Selects all items in the collection.
     */
    selectAll(): void;
    /**
     * Removes all keys from the selection.
     */
    clearSelection(): void;
    /**
     * Toggles between select all and an empty selection.
     */
    toggleSelectAll(): void;
    select(key: Key, e?: PressEvent | LongPressEvent | PointerEvent): void;
    /**
     * Returns whether the current selection is equal to the given selection.
     */
    isSelectionEqual(selection: Set<Key>): boolean;
    canSelectItem(key: Key): boolean;
    private canSelectItemIn;
    isDisabled(key: Key): boolean;
    isLink(key: Key): boolean;
    getItemProps(key: Key): any;
    withCollection(collection: Collection<Node<unknown>>): SelectionManager;
}
export {};
