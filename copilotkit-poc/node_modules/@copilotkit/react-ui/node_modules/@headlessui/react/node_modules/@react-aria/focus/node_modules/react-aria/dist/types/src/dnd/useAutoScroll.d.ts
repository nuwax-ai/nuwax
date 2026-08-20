import { RefObject } from '@react-types/shared';
interface AutoScrollAria {
    move(x: number, y: number): void;
    stop(): void;
}
export declare function useAutoScroll(ref: RefObject<Element | null>): AutoScrollAria;
export {};
