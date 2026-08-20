import { Direction, DisabledBehavior, Key, KeyboardDelegate, LayoutDelegate, Node, Rect, RefObject, Size } from '@react-types/shared';
import { IGridCollection as GridCollection } from 'react-stately/private/grid/GridCollection';
export interface GridKeyboardDelegateOptions<C> {
    collection: C;
    disabledKeys: Set<Key>;
    disabledBehavior?: DisabledBehavior;
    ref?: RefObject<HTMLElement | null>;
    direction: Direction;
    collator?: Intl.Collator;
    layoutDelegate?: LayoutDelegate;
    /** @deprecated - Use layoutDelegate instead. */
    layout?: DeprecatedLayout;
    focusMode?: 'row' | 'cell';
}
export declare class GridKeyboardDelegate<T, C extends GridCollection<T>> implements KeyboardDelegate {
    collection: C;
    protected disabledKeys: Set<Key>;
    protected disabledBehavior: DisabledBehavior;
    protected direction: Direction;
    protected collator: Intl.Collator | undefined;
    protected layoutDelegate: LayoutDelegate;
    protected focusMode: 'row' | 'cell';
    constructor(options: GridKeyboardDelegateOptions<C>);
    protected isCell(node: Node<T>): boolean;
    protected isRow(node: Node<T>): boolean;
    private isDisabled;
    protected findPreviousKey(fromKey?: Key, pred?: (item: Node<T>) => boolean, includeDisabled?: boolean): Key | null;
    protected findNextKey(fromKey?: Key, pred?: (item: Node<T>) => boolean, includeDisabled?: boolean): Key | null;
    protected getKeyForItemInRowByIndex(key: Key, index?: number): Key | null;
    getKeyBelow(fromKey: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getKeyAbove(fromKey: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getKeyRightOf(key: Key): Key | null;
    getKeyLeftOf(key: Key): Key | null;
    getFirstKey(fromKey?: Key, global?: boolean): Key | null;
    getLastKey(fromKey?: Key, global?: boolean): Key | null;
    getKeyPageAbove(fromKey: Key): Key | null;
    getKeyPageBelow(fromKey: Key): Key | null;
    getKeyForSearch(search: string, fromKey?: Key): Key | null;
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
export {};
