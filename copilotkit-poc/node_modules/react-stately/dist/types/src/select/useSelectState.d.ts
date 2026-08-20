import { CollectionBase, CollectionStateBase, FocusableProps, FocusStrategy, HelpTextProps, InputBase, Key, LabelableProps, Node, TextInputBase, Validation, ValueBase } from '@react-types/shared';
import { FormValidationState } from '../form/useFormValidationState';
import { ListState } from '../list/useListState';
import { OverlayTriggerState } from '../overlays/useOverlayTriggerState';
export type SelectionMode = 'single' | 'multiple';
export type ValueType<M extends SelectionMode> = M extends 'single' ? Key | null : readonly Key[];
export type ChangeValueType<M extends SelectionMode> = M extends 'single' ? Key | null : Key[];
type ValidationType<M extends SelectionMode> = M extends 'single' ? Key : Key[];
export interface SelectProps<T, M extends SelectionMode = 'single'> extends CollectionBase<T>, Omit<InputBase, 'isReadOnly'>, ValueBase<ValueType<M>, ChangeValueType<M>>, Validation<ValidationType<M>>, HelpTextProps, LabelableProps, TextInputBase, FocusableProps {
    /**
     * Whether single or multiple selection is enabled.
     *
     * @default 'single'
     */
    selectionMode?: M;
    /**
     * The currently selected key in the collection (controlled).
     *
     * @deprecated
     */
    selectedKey?: Key | null;
    /**
     * The initial selected key in the collection (uncontrolled).
     *
     * @deprecated
     */
    defaultSelectedKey?: Key | null;
    /**
     * Handler that is called when the selection changes.
     *
     * @deprecated
     */
    onSelectionChange?: (key: Key | null) => void;
    /** Sets the open state of the menu. */
    isOpen?: boolean;
    /** Sets the default open state of the menu. */
    defaultOpen?: boolean;
    /** Method that is called when the open state of the menu changes. */
    onOpenChange?: (isOpen: boolean) => void;
    /**
     * Whether the Select should close when an item is selected. Defaults to true if selectionMode is
     * single, false otherwise.
     */
    shouldCloseOnSelect?: boolean;
    /** Whether the select should be allowed to be open when the collection is empty. */
    allowsEmptyCollection?: boolean;
}
export interface SelectStateOptions<T, M extends SelectionMode = 'single'> extends Omit<SelectProps<T, M>, 'children'>, CollectionStateBase<T> {
}
export interface SelectState<T, M extends SelectionMode = 'single'> extends ListState<T>, OverlayTriggerState, FormValidationState {
    /**
     * The key for the first selected item.
     *
     * @deprecated
     */
    readonly selectedKey: Key | null;
    /**
     * The default selected key.
     *
     * @deprecated
     */
    readonly defaultSelectedKey: Key | null;
    /**
     * Sets the selected key.
     *
     * @deprecated
     */
    setSelectedKey(key: Key | null): void;
    /** The current select value. */
    readonly value: ValueType<M>;
    /** The default select value. */
    readonly defaultValue: ValueType<M>;
    /** Sets the select value. */
    setValue(value: Key | readonly Key[] | null): void;
    /**
     * The value of the first selected item.
     *
     * @deprecated
     */
    readonly selectedItem: Node<T> | null;
    /** The value of the selected items. */
    readonly selectedItems: Node<T>[];
    /** Whether the select is currently focused. */
    readonly isFocused: boolean;
    /** Sets whether the select is focused. */
    setFocused(isFocused: boolean): void;
    /** Controls which item will be auto focused when the menu opens. */
    readonly focusStrategy: FocusStrategy | null;
    /** Opens the menu. */
    open(focusStrategy?: FocusStrategy | null): void;
    /** Toggles the menu. */
    toggle(focusStrategy?: FocusStrategy | null): void;
}
/**
 * Provides state management for a select component. Handles building a collection
 * of items from props, handles the open state for the popup menu, and manages
 * multiple selection state.
 */
export declare function useSelectState<T, M extends SelectionMode = 'single'>(props: SelectStateOptions<T, M>): SelectState<T, M>;
export {};
