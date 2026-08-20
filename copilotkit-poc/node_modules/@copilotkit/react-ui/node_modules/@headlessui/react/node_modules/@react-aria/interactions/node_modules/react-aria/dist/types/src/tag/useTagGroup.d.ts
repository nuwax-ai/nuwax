import { AriaGridListProps } from '../gridlist/useGridList';
import { AriaLabelingProps, CollectionBase, DOMAttributes, DOMProps, HelpTextProps, Key, KeyboardDelegate, LabelableProps, MultipleSelection, RefObject, SelectionBehavior } from '@react-types/shared';
import type { ListState } from 'react-stately/useListState';
import { ReactNode } from 'react';
export interface TagGroupAria {
    /** Props for the tag grouping element. */
    gridProps: DOMAttributes;
    /** Props for the tag group's visible label (if any). */
    labelProps: DOMAttributes;
    /** Props for the tag group description element, if any. */
    descriptionProps: DOMAttributes;
    /** Props for the tag group error message element, if any. */
    errorMessageProps: DOMAttributes;
}
export interface AriaTagGroupProps<T> extends CollectionBase<T>, MultipleSelection, Pick<AriaGridListProps<T>, 'escapeKeyBehavior' | 'onAction'>, DOMProps, LabelableProps, AriaLabelingProps, Omit<HelpTextProps, 'errorMessage'> {
    /**
     * How multiple selection should behave in the collection.
     *
     * @default 'toggle'
     */
    selectionBehavior?: SelectionBehavior;
    /** Whether selection should occur on press up instead of press down. */
    shouldSelectOnPressUp?: boolean;
    /** Handler that is called when a user deletes a tag. */
    onRemove?: (keys: Set<Key>) => void;
    /** An error message for the field. */
    errorMessage?: ReactNode;
    /**
     * Whether pressing the escape key should clear selection in the TagGroup or not.
     *
     * Most experiences should not modify this option as it eliminates a keyboard user's ability to
     * easily clear selection. Only use if the escape key is being handled externally or should not
     * trigger selection clearing contextually.
     *
     * @default 'clearSelection'
     */
    escapeKeyBehavior?: 'clearSelection' | 'none';
}
export interface AriaTagGroupOptions<T> extends Omit<AriaTagGroupProps<T>, 'children'> {
    /**
     * An optional keyboard delegate to handle arrow key navigation,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
}
interface HookData {
    onRemove?: (keys: Set<Key>) => void;
}
export declare const hookData: WeakMap<ListState<any>, HookData>;
/**
 * Provides the behavior and accessibility implementation for a tag group component. A tag group is
 * a focusable list of labels, categories, keywords, filters, or other items, with support for
 * keyboard navigation, selection, and removal.
 *
 * @param props - Props to be applied to the tag group.
 * @param state - State for the tag group, as returned by `useListState`.
 * @param ref - A ref to a DOM element for the tag group.
 */
export declare function useTagGroup<T>(props: AriaTagGroupOptions<T>, state: ListState<T>, ref: RefObject<HTMLElement | null>): TagGroupAria;
export {};
