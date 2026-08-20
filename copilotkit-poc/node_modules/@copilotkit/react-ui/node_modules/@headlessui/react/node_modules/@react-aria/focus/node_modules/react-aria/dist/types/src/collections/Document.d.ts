import { BaseCollection, CollectionNode } from './BaseCollection';
import { CollectionNodeClass } from './CollectionBuilder';
import { CSSProperties, ForwardedRef, ReactElement, ReactNode } from 'react';
import { Node } from '@react-types/shared';
/**
 * A mutable node in the fake DOM tree. When mutated, it marks itself as dirty
 * and queues an update with the owner document.
 */
export declare class BaseNode<T> {
    private _firstChild;
    private _lastChild;
    private _previousSibling;
    private _nextSibling;
    private _parentNode;
    private _minInvalidChildIndex;
    ownerDocument: Document<T, any>;
    constructor(ownerDocument: Document<T, any>);
    [Symbol.iterator](): Iterator<ElementNode<T>>;
    get firstChild(): ElementNode<T> | null;
    set firstChild(firstChild: ElementNode<T> | null);
    get lastChild(): ElementNode<T> | null;
    set lastChild(lastChild: ElementNode<T> | null);
    get previousSibling(): ElementNode<T> | null;
    set previousSibling(previousSibling: ElementNode<T> | null);
    get nextSibling(): ElementNode<T> | null;
    set nextSibling(nextSibling: ElementNode<T> | null);
    get parentNode(): BaseNode<T> | null;
    set parentNode(parentNode: BaseNode<T> | null);
    get isConnected(): boolean;
    private invalidateChildIndices;
    updateChildIndices(): void;
    appendChild(child: ElementNode<T>): void;
    insertBefore(newNode: ElementNode<T>, referenceNode: ElementNode<T>): void;
    removeChild(child: ElementNode<T>): void;
    addEventListener(): void;
    removeEventListener(): void;
    get previousVisibleSibling(): ElementNode<T> | null;
    get nextVisibleSibling(): ElementNode<T> | null;
    get firstVisibleChild(): ElementNode<T> | null;
    get lastVisibleChild(): ElementNode<T> | null;
}
/**
 * A mutable element node in the fake DOM tree. It owns an immutable
 * Collection Node which is copied on write.
 */
export declare class ElementNode<T> extends BaseNode<T> {
    nodeType: number;
    node: CollectionNode<T> | null;
    isMutated: boolean;
    private _index;
    isHidden: boolean;
    constructor(type: string, ownerDocument: Document<T, any>);
    get index(): number;
    set index(index: number);
    get level(): number;
    /**
     * Lazily gets a mutable instance of a Node. If the node has already
     * been cloned during this update cycle, it just returns the existing one.
     */
    private getMutableNode;
    updateNode(): void;
    setProps<E extends Element>(obj: {
        [key: string]: any;
    }, ref: ForwardedRef<E>, CollectionNodeClass: CollectionNodeClass<any>, rendered?: ReactNode, render?: (node: Node<T>) => ReactElement): void;
    get style(): CSSProperties;
    hasAttribute(): void;
    setAttribute(): void;
    setAttributeNS(): void;
    removeAttribute(): void;
}
/**
 * A mutable Document in the fake DOM. It owns an immutable Collection instance,
 * which is lazily copied on write during updates.
 */
export declare class Document<T, C extends BaseCollection<T> = BaseCollection<T>> extends BaseNode<T> {
    nodeType: number;
    ownerDocument: Document<T, C>;
    dirtyNodes: Set<BaseNode<T>>;
    isSSR: boolean;
    nodeId: number;
    nodesByProps: WeakMap<object, ElementNode<T>>;
    private collection;
    private nextCollection;
    private subscriptions;
    private queuedRender;
    private inSubscription;
    constructor(collection: C);
    get isConnected(): boolean;
    createElement(type: string): ElementNode<T>;
    private getMutableCollection;
    markDirty(node: BaseNode<T>): void;
    private addNode;
    private removeNode;
    /** Finalizes the collection update, updating all nodes and freezing the collection. */
    getCollection(): C;
    updateCollection(): void;
    queueUpdate(): void;
    subscribe(fn: () => void): () => boolean;
    resetAfterSSR(): void;
}
