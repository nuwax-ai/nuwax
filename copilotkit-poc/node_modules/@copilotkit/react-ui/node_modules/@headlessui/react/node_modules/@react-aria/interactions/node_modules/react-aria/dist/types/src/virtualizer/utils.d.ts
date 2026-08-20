import { Direction } from '@react-types/shared';
export type RTLOffsetType = 'negative' | 'positive-descending' | 'positive-ascending';
export declare function getRTLOffsetType(recalculate?: boolean): RTLOffsetType;
export declare function getScrollLeft(node: Element, direction: Direction): number;
export declare function setScrollLeft(node: Element, direction: Direction, scrollLeft: number): void;
