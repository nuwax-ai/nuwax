import { RefObject } from '@react-types/shared';
type useResizeObserverOptionsType<T> = {
    ref: RefObject<T | undefined | null> | undefined;
    box?: ResizeObserverBoxOptions;
    onResize: () => void;
};
export declare function useResizeObserver<T extends Element>(options: useResizeObserverOptionsType<T>): void;
export {};
