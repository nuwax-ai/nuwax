import type { SyntheticEvent } from 'react';
/**
 * ShadowDOM safe version of Node.contains.
 */
export declare function nodeContains(node: Node | Element | null | undefined, otherNode: Node | Element | null | undefined): boolean;
/**
 * ShadowDOM safe version of document.activeElement.
 */
export declare const getActiveElement: (doc?: Document) => Element | null;
type EventTargetType<T> = T extends SyntheticEvent<infer E, any> ? E : EventTarget;
/**
 * ShadowDOM safe version of event.target.
 */
export declare function getEventTarget<T extends Event | SyntheticEvent>(event: T): EventTargetType<T>;
/**
 * ShadowDOM safe fast version of node.contains(document.activeElement).
 *
 * @param node
 * @returns
 */
export declare function isFocusWithin(node: Element | null | undefined): boolean;
export {};
