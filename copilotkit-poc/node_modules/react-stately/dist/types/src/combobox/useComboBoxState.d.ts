import { CollectionBase, CollectionStateBase, FocusableProps, FocusStrategy, HelpTextProps, InputBase, Key, LabelableProps, Node, TextInputBase, Validation, ValueBase } from '@react-types/shared';
import { FormValidationState } from '../form/useFormValidationState';
import { ListState } from '../list/useListState';
import { OverlayTriggerState } from '../overlays/useOverlayTriggerState';
export type MenuTriggerAction = 'focus' | 'input' | 'manual';
export type SelectionMode = 'single' | 'multiple';
export type ValueType<M extends SelectionMode> = M extends 'single' ? Key | null : Key[];
export type ChangeValueType<M extends SelectionMode> = M extends 'single' ? Key | null : Key[];
type ValidationType<M extends SelectionMode> = M extends 'single' ? Key | null : Key[];
export interface ComboBoxValidationValue<M extends SelectionMode = 'single'> {
    /**
     * The selected key in the ComboBox.
     *
     * @deprecated
     */
    selectedKey: Key | null;
    /** The keys of the currently selected items. */
    value: ValidationType<M>;
    /** The value of the ComboBox input. */
    inputValue: string;
}
export interface ComboBoxProps<T, M extends SelectionMode = 'single'> extends CollectionBase<T>, InputBase, ValueBase<ValueType<M>, ChangeValueType<M>>, TextInputBase, Validation<ComboBoxValidationValue<M>>, FocusableProps<HTMLInputElement>, LabelableProps, HelpTextProps {
    /** The list of ComboBox items (uncontrolled). */
    defaultItems?: Iterable<T>;
    /** The list of ComboBox items (controlled). */
    items?: Iterable<T>;
    /**
     * Method that is called when the open state of the menu changes. Returns the new open state and
     * the action that caused the opening of the menu.
     */
    onOpenChange?: (isOpen: boolean, menuTrigger?: MenuTriggerAction) => void;
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
    /** The value of the ComboBox input (controlled). */
    inputValue?: string;
    /** The default value of the ComboBox input (uncontrolled). */
    defaultInputValue?: string;
    /** Handler that is called when the ComboBox input value changes. */
    onInputChange?: (value: string) => void;
    /** Whether the ComboBox allows a non-item matching input value to be set. */
    allowsCustomValue?: boolean;
    /**
     * The interaction required to display the ComboBox menu.
     *
     * @default 'input'
     */
    menuTrigger?: MenuTriggerAction;
}
export interface ComboBoxState<T, M extends SelectionMode = 'single'> extends ListState<T>, OverlayTriggerState, FormValidationState {
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
    /** The current combobox value. */
    readonly value: ValueType<M>;
    /** The default combobox value. */
    readonly defaultValue: ValueType<M>;
    /** Sets the combobox value. */
    setValue(value: Key | readonly Key[] | null): void;
    /**
     * The value of the first selected item.
     *
     * @deprecated
     */
    readonly selectedItem: Node<T> | null;
    /** The value of the selected items. */
    readonly selectedItems: Node<T>[];
    /** The current value of the combo box input. */
    inputValue: string;
    /** The default value of the combo box input. */
    defaultInputValue: string;
    /** Sets the value of the combo box input. */
    setInputValue(value: string): void;
    /** Selects the currently focused item and updates the input value. */
    commit(): void;
    /** Controls which item will be auto focused when the menu opens. */
    readonly focusStrategy: FocusStrategy | null;
    /** Whether the select is currently focused. */
    readonly isFocused: boolean;
    /** Sets whether the select is focused. */
    setFocused(isFocused: boolean): void;
    /** Opens the menu. */
    open(focusStrategy?: FocusStrategy | null, trigger?: MenuTriggerAction): void;
    /** Toggles the menu. */
    toggle(focusStrategy?: FocusStrategy | null, trigger?: MenuTriggerAction): void;
    /** Resets the input value to the previously selected item's text if any and closes the menu. */
    revert(): void;
}
type FilterFn = (textValue: string, inputValue: string) => boolean;
export interface ComboBoxStateOptions<T, M extends SelectionMode = 'single'> extends Omit<ComboBoxProps<T, M>, 'children'>, CollectionStateBase<T> {
    /** The filter function used to determine if a option should be included in the combo box list. */
    defaultFilter?: FilterFn;
    /** Whether the combo box allows the menu to be open when the collection is empty. */
    allowsEmptyCollection?: boolean;
    /** Whether the combo box menu should close on blur. */
    shouldCloseOnBlur?: boolean;
}
/**
 * Provides state management for a combo box component. Handles building a collection of items from
 * props and manages the option selection state of the combo box. In addition, it tracks the input
 * value, focus state, and other properties of the combo box.
 */
export declare function useComboBoxState<T, M extends SelectionMode = 'single'>(props: ComboBoxStateOptions<T, M>): ComboBoxState<T, M>;
export {};
