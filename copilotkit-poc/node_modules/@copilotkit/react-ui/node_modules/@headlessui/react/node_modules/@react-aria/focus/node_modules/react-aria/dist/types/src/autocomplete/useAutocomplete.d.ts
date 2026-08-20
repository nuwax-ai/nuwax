import { AriaLabelingProps, DOMProps, FocusableElement, FocusEvents, KeyboardEvents, Node, RefObject, ValueBase } from '@react-types/shared';
import { AriaTextFieldProps } from '../textfield/useTextField';
import { AutocompleteProps, AutocompleteState } from 'react-stately/private/autocomplete/useAutocompleteState';
export interface CollectionOptions extends DOMProps, AriaLabelingProps {
    /** Whether the collection items should use virtual focus instead of being focused directly. */
    shouldUseVirtualFocus: boolean;
    /** Whether typeahead is disabled. */
    disallowTypeAhead: boolean;
}
export interface InputProps<T = FocusableElement> extends DOMProps, FocusEvents<T>, KeyboardEvents, Pick<ValueBase<string>, 'onChange' | 'value'>, Pick<AriaTextFieldProps, 'enterKeyHint' | 'aria-controls' | 'aria-autocomplete' | 'aria-activedescendant' | 'spellCheck' | 'autoCorrect' | 'autoComplete'> {
}
export interface AriaAutocompleteProps<T> extends AutocompleteProps {
    /**
     * An optional filter function used to determine if a option should be included in the
     * autocomplete list. Include this if the items you are providing to your wrapped collection
     * aren't filtered by default.
     */
    filter?: (textValue: string, inputValue: string, node: Node<T>) => boolean;
    /**
     * Whether or not to focus the first item in the collection after a filter is performed. Note this
     * is only applicable if virtual focus behavior is not turned off via `disableVirtualFocus`.
     *
     * @default false
     */
    disableAutoFocusFirst?: boolean;
    /**
     * Whether the autocomplete should disable virtual focus, instead making the wrapped collection
     * directly tabbable.
     *
     * @default false
     */
    disableVirtualFocus?: boolean;
}
export interface AriaAutocompleteOptions<T> extends Omit<AriaAutocompleteProps<T>, 'children'> {
    /** The ref for the wrapped collection element. */
    inputRef: RefObject<HTMLInputElement | null>;
    /** The ref for the wrapped collection element. */
    collectionRef: RefObject<HTMLElement | null>;
}
export interface AutocompleteAria<T> {
    /**
     * Props for the autocomplete input element. These should be passed to the input's aria hooks
     * (e.g. useTextField/useSearchField/etc) respectively.
     */
    inputProps: InputProps;
    /** Props for the collection, to be passed to collection's respective aria hook (e.g. useMenu). */
    collectionProps: CollectionOptions;
    /** Ref to attach to the wrapped collection. */
    collectionRef: RefObject<HTMLElement | null>;
    /**
     * A filter function that returns if the provided collection node should be filtered out of the
     * collection.
     */
    filter?: (nodeTextValue: string, node: Node<T>) => boolean;
}
/**
 * Provides the behavior and accessibility implementation for an autocomplete component. An
 * autocomplete combines a text input with a collection, allowing users to filter the collection's
 * contents match a query.
 *
 * @param props - Props for the autocomplete.
 * @param state - State for the autocomplete, as returned by `useAutocompleteState`.
 */
export declare function useAutocomplete<T>(props: AriaAutocompleteOptions<T>, state: AutocompleteState): AutocompleteAria<T>;
