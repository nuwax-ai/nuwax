export declare class ShadowTreeWalker implements TreeWalker {
    readonly filter: NodeFilter | null;
    readonly root: Node;
    readonly whatToShow: number;
    private _doc;
    private _walkerStack;
    private _currentNode;
    private _currentSetFor;
    constructor(doc: Document, root: Node, whatToShow?: number, filter?: NodeFilter | null);
    private _acceptNode;
    get currentNode(): Node;
    set currentNode(node: Node);
    get doc(): Document;
    firstChild(): Node | null;
    lastChild(): Node | null;
    nextNode(): Node | null;
    previousNode(): Node | null;
    /**
     * @deprecated
     */
    nextSibling(): Node | null;
    /**
     * @deprecated
     */
    previousSibling(): Node | null;
    /**
     * @deprecated
     */
    parentNode(): Node | null;
}
/**
 * ShadowDOM safe version of document.createTreeWalker.
 */
export declare function createShadowTreeWalker(doc: Document, root: Node, whatToShow?: number, filter?: NodeFilter | null): TreeWalker;
