import { ShadowTreeWalker } from '../utils/shadowdom/ShadowTreeWalker';
import { FocusableElement, RefObject } from '@react-types/shared';
import { JSX, ReactNode } from 'react';
export interface FocusScopeProps {
    /** The contents of the focus scope. */
    children: ReactNode;
    /**
     * Whether to contain focus inside the scope, so users cannot
     * move focus outside, for example in a modal dialog.
     */
    contain?: boolean;
    /**
     * Whether to restore focus back to the element that was focused
     * when the focus scope mounted, after the focus scope unmounts.
     */
    restoreFocus?: boolean;
    /** Whether to auto focus the first focusable element in the focus scope on mount. */
    autoFocus?: boolean;
}
export interface FocusManagerOptions {
    /** The element to start searching from. The currently focused element by default. */
    from?: Element;
    /** Whether to only include tabbable elements, or all focusable elements. */
    tabbable?: boolean;
    /** Whether focus should wrap around when it reaches the end of the scope. */
    wrap?: boolean;
    /** A callback that determines whether the given element is focused. */
    accept?: (node: Element) => boolean;
}
export interface FocusManager {
    /** Moves focus to the next focusable or tabbable element in the focus scope. */
    focusNext(opts?: FocusManagerOptions): FocusableElement | null;
    /** Moves focus to the previous focusable or tabbable element in the focus scope. */
    focusPrevious(opts?: FocusManagerOptions): FocusableElement | null;
    /** Moves focus to the first focusable or tabbable element in the focus scope. */
    focusFirst(opts?: FocusManagerOptions): FocusableElement | null;
    /** Moves focus to the last focusable or tabbable element in the focus scope. */
    focusLast(opts?: FocusManagerOptions): FocusableElement | null;
}
type ScopeRef = RefObject<Element[] | null> | null;
/**
 * A FocusScope manages focus for its descendants. It supports containing focus inside
 * the scope, restoring focus to the previously focused element on unmount, and auto
 * focusing children on mount. It also acts as a container for a programmatic focus
 * management interface that can be used to move focus forward and back in response
 * to user events.
 */
export declare function FocusScope(props: FocusScopeProps): JSX.Element;
/**
 * Returns a FocusManager interface for the parent FocusScope.
 * A FocusManager can be used to programmatically move focus within
 * a FocusScope, e.g. in response to user events like keyboard navigation.
 */
export declare function useFocusManager(): FocusManager | undefined;
/** @private */
export declare function isElementInChildOfActiveScope(element: Element): boolean;
/**
 * Create a [TreeWalker]{@link https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker}
 * that matches all focusable/tabbable elements.
 */
export declare function getFocusableTreeWalker(root: Element, opts?: FocusManagerOptions, scope?: Element[]): ShadowTreeWalker | TreeWalker;
/**
 * Creates a FocusManager object that can be used to move focus within an element.
 */
export declare function createFocusManager(ref: RefObject<Element | null>, defaultOptions?: FocusManagerOptions): FocusManager;
declare class Tree {
    root: TreeNode;
    private fastMap;
    constructor();
    get size(): number;
    getTreeNode(data: ScopeRef): TreeNode | undefined;
    addTreeNode(scopeRef: ScopeRef, parent: ScopeRef, nodeToRestore?: FocusableElement): void;
    addNode(node: TreeNode): void;
    removeTreeNode(scopeRef: ScopeRef): void;
    traverse(node?: TreeNode): Generator<TreeNode>;
    clone(): Tree;
}
declare class TreeNode {
    scopeRef: ScopeRef;
    nodeToRestore?: FocusableElement;
    parent?: TreeNode;
    children: Set<TreeNode>;
    contain: boolean;
    constructor(props: {
        scopeRef: ScopeRef;
    });
    addChild(node: TreeNode): void;
    removeChild(node: TreeNode): void;
}
export declare let focusScopeTree: Tree;
export {};
