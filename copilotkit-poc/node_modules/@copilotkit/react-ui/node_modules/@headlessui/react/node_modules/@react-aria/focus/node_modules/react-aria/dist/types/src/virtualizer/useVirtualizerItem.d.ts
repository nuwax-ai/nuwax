import { Key, RefObject } from '@react-types/shared';
import { LayoutInfo, Size } from 'react-stately/useVirtualizerState';
interface IVirtualizer {
    updateItemSize(key: Key, size: Size): void;
}
export interface VirtualizerItemOptions {
    layoutInfo: LayoutInfo | null;
    virtualizer: IVirtualizer;
    ref: RefObject<HTMLElement | null>;
}
export declare function useVirtualizerItem(options: VirtualizerItemOptions): {
    updateSize: () => void;
};
export {};
