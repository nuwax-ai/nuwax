import { AriaGridListOptions, AriaGridListProps, GridListProps } from '../gridlist/useGridList';
import { DOMAttributes, KeyboardDelegate, RefObject } from '@react-types/shared';
import { TreeState } from 'react-stately/useTreeState';
export interface TreeProps<T> extends GridListProps<T> {
}
export interface AriaTreeProps<T> extends Omit<AriaGridListProps<T>, 'keyboardNavigationBehavior'> {
}
export interface AriaTreeOptions<T> extends Omit<AriaGridListOptions<T>, 'children' | 'shouldFocusWrap'> {
    /**
     * An optional keyboard delegate implementation for type to select,
     * to override the default.
     */
    keyboardDelegate?: KeyboardDelegate;
}
export interface TreeAria {
    /** Props for the treegrid element. */
    gridProps: DOMAttributes;
}
/**
 * Provides the behavior and accessibility implementation for a single column treegrid component
 * with interactive children. A tree grid provides users with a way to navigate nested hierarchical
 * information.
 *
 * @param props - Props for the treegrid.
 * @param state - State for the treegrid, as returned by `useTreeState`.
 * @param ref - The ref attached to the treegrid element.
 */
export declare function useTree<T>(props: AriaTreeOptions<T>, state: TreeState<T>, ref: RefObject<HTMLElement | null>): TreeAria;
