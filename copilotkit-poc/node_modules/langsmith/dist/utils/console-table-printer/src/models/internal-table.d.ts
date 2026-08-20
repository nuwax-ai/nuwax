import { ALIGNMENT, COLOR } from './common.js';
import { Valuetransform } from './external-table.js';
export interface Column {
    name: string;
    title: string;
    alignment?: ALIGNMENT;
    color?: COLOR;
    length?: number;
    minLen?: number;
    maxLen?: number;
    transform?: Valuetransform;
}
type TableLineDetailsKeys = 'left' | 'right' | 'mid' | 'other';
export type TableLineDetails = {
    [key in TableLineDetailsKeys]: string;
};
export type TableStyleDetails = {
    headerTop: TableLineDetails;
    headerBottom: TableLineDetails;
    tableBottom: TableLineDetails;
    vertical: string;
    rowSeparator: TableLineDetails;
};
export {};
