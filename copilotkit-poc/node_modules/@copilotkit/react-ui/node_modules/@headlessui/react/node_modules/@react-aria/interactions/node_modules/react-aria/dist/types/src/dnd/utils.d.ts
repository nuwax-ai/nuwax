import { DROP_OPERATION } from './constants';
import { DirectoryDropItem, DragItem, DropItem, FileDropItem, DragTypes as IDragTypes, Key, RefObject, TextDropItem } from '@react-types/shared';
import { DroppableCollectionState } from 'react-stately/useDroppableCollectionState';
interface DroppableCollectionMap {
    id: string;
    ref: RefObject<HTMLElement | null>;
}
export declare const droppableCollectionMap: WeakMap<DroppableCollectionState, DroppableCollectionMap>;
export declare const DIRECTORY_DRAG_TYPE: symbol;
export declare function getDroppableCollectionId(state: DroppableCollectionState): string;
export declare function getDroppableCollectionRef(state: DroppableCollectionState): RefObject<HTMLElement | null>;
export declare function getTypes(items: DragItem[]): Set<string>;
export declare function useDragModality(): string;
export declare function getDragModality(): string;
export declare function writeToDataTransfer(dataTransfer: DataTransfer, items: DragItem[]): void;
export declare class DragTypes implements IDragTypes {
    private types;
    private includesUnknownTypes;
    constructor(dataTransfer: DataTransfer);
    has(type: string | symbol): boolean;
}
export declare function readFromDataTransfer(dataTransfer: DataTransfer): DropItem[];
/** Returns whether a drop item contains text data. */
export declare function isTextDropItem(dropItem: DropItem): dropItem is TextDropItem;
/** Returns whether a drop item is a file. */
export declare function isFileDropItem(dropItem: DropItem): dropItem is FileDropItem;
/** Returns whether a drop item is a directory. */
export declare function isDirectoryDropItem(dropItem: DropItem): dropItem is DirectoryDropItem;
export interface DnDState {
    /** A ref for the of the drag items in the current drag session if any. */
    draggingCollectionRef?: RefObject<HTMLElement | null>;
    /** The set of currently dragged keys. */
    draggingKeys: Set<Key>;
    /** A ref for the collection that is targeted for a drop operation, if any. */
    dropCollectionRef?: RefObject<HTMLElement | null>;
}
export declare let globalDndState: DnDState;
export declare function setDraggingCollectionRef(ref: RefObject<HTMLElement | null>): void;
export declare function setDraggingKeys(keys: Set<Key>): void;
export declare function setDropCollectionRef(ref?: RefObject<HTMLElement | null>): void;
export declare function clearGlobalDnDState(): void;
export declare function setGlobalDnDState(state: DnDState): void;
export declare function isInternalDropOperation(ref?: RefObject<HTMLElement | null>): boolean;
type DropEffect = 'none' | 'copy' | 'link' | 'move';
export declare let globalDropEffect: DropEffect | undefined;
export declare function setGlobalDropEffect(dropEffect: DropEffect | undefined): void;
export declare let globalAllowedDropOperations: DROP_OPERATION;
export declare function setGlobalAllowedDropOperations(o: DROP_OPERATION): void;
export {};
