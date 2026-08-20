import { Collection, Direction, Key, KeyboardDelegate, Node, Orientation } from '@react-types/shared';
export declare class TabsKeyboardDelegate<T> implements KeyboardDelegate {
    private collection;
    private flipDirection;
    private disabledKeys;
    private tabDirection;
    constructor(collection: Collection<Node<T>>, direction: Direction, orientation: Orientation, disabledKeys?: Set<Key>);
    getKeyLeftOf(key: Key): Key | null;
    getKeyRightOf(key: Key): Key | null;
    private isDisabled;
    getFirstKey(): Key | null;
    getLastKey(): Key | null;
    getKeyAbove(key: Key): Key | null;
    getKeyBelow(key: Key): Key | null;
    getNextKey(startKey: Key): Key | null;
    getPreviousKey(startKey: Key): Key | null;
}
