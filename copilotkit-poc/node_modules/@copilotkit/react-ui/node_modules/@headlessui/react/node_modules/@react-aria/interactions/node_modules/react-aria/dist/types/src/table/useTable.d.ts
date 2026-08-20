import { GridAria, GridProps } from '../grid/useGrid';
import { Key, LayoutDelegate, Rect, RefObject, Size } from '@react-types/shared';
import { TableState } from 'react-stately/useTableState';
import { TreeGridState } from 'react-stately/private/table/useTreeGridState';
export interface AriaTableProps extends GridProps {
    /**
     * The layout object for the table. Computes what content is visible and how to position and style
     * them.
     */
    layoutDelegate?: LayoutDelegate;
    /** @deprecated - Use layoutDelegate instead. */
    layout?: DeprecatedLayout;
}
interface DeprecatedLayout {
    getLayoutInfo(key: Key): DeprecatedLayoutInfo;
    getContentSize(): Size;
    virtualizer: DeprecatedVirtualizer;
}
interface DeprecatedLayoutInfo {
    rect: Rect;
}
interface DeprecatedVirtualizer {
    visibleRect: Rect;
}
/**
 * Provides the behavior and accessibility implementation for a table component. A table displays
 * data in rows and columns and enables a user to navigate its contents via directional navigation
 * keys, and optionally supports row selection and sorting.
 *
 * @param props - Props for the table.
 * @param state - State for the table, as returned by `useTableState`.
 * @param ref - The ref attached to the table element.
 */
export declare function useTable<T>(props: AriaTableProps, state: TableState<T> | TreeGridState<T>, ref: RefObject<HTMLElement | null>): GridAria;
export {};
