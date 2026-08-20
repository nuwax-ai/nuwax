import { Collection, Key } from '@react-types/shared';
import { RefObject } from 'react';
interface Event {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
}
export declare function isNonContiguousSelectionModifier(e: Event): boolean;
export declare function getItemElement(collectionRef: RefObject<HTMLElement | null>, key: Key): Element | null | undefined;
export declare function useCollectionId(collection: Collection<any>): string;
export declare function getCollectionId(collection: Collection<any>): string;
export {};
