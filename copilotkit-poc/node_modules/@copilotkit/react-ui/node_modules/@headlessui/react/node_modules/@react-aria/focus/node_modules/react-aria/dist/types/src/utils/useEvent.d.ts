import { RefObject } from '@react-types/shared';
export declare function useEvent<K extends keyof GlobalEventHandlersEventMap>(ref: RefObject<EventTarget | null>, event: K | (string & {}), handler?: (this: Document, ev: GlobalEventHandlersEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
