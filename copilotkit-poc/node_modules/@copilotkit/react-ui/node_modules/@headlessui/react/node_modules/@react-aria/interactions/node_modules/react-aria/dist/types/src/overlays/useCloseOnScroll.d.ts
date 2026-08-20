import { RefObject } from '@react-types/shared';
export declare const onCloseMap: WeakMap<Element, () => void>;
interface CloseOnScrollOptions {
    triggerRef: RefObject<Element | null>;
    isOpen?: boolean;
    onClose?: (() => void) | null;
}
/** @private */
export declare function useCloseOnScroll(opts: CloseOnScrollOptions): void;
export {};
