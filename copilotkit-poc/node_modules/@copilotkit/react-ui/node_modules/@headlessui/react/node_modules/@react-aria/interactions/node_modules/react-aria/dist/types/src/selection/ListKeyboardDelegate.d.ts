import { Collection, Direction, DisabledBehavior, Key, KeyboardDelegate, LayoutDelegate, Node, Orientation, RefObject } from '@react-types/shared';
interface ListKeyboardDelegateOptions<T> {
    collection: Collection<Node<T>>;
    ref: RefObject<HTMLElement | null>;
    collator?: Intl.Collator;
    layout?: 'stack' | 'grid';
    orientation?: Orientation;
    direction?: Direction;
    disabledKeys?: Set<Key>;
    disabledBehavior?: DisabledBehavior;
    layoutDelegate?: LayoutDelegate;
}
export declare class ListKeyboardDelegate<T> implements KeyboardDelegate {
    private collection;
    private disabledKeys;
    private disabledBehavior;
    private ref;
    private collator;
    private layout;
    private orientation?;
    private direction?;
    private layoutDelegate;
    constructor(collection: Collection<Node<T>>, disabledKeys: Set<Key>, ref: RefObject<HTMLElement | null>, collator?: Intl.Collator, expandedKeys?: Set<Key>);
    constructor(options: ListKeyboardDelegateOptions<T>);
    private isDisabled;
    private findNextNonDisabled;
    getNextKey(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getPreviousKey(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    private findKey;
    private isSameRow;
    private isSameColumn;
    getKeyBelow(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getKeyAbove(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    private getNextColumn;
    getKeyRightOf?(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getKeyLeftOf?(key: Key, options?: {
        includeDisabled?: boolean;
    }): Key | null;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getKeyPageAbove(key: Key): Key | null;
    getKeyPageBelow(key: Key): Key | null;
    getKeyForSearch(search: string, fromKey?: Key): Key | null;
}
export {};
