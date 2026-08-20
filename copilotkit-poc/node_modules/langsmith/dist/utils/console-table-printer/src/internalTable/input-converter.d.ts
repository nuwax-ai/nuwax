import { ColumnOptionsRaw, ComputedColumn, DefaultColumnOptions } from '../models/external-table.js';
import { Column } from '../models/internal-table.js';
export declare const objIfExists: (key: string, val: any) => {
    [x: string]: any;
};
export declare const rawColumnToInternalColumn: (column: ColumnOptionsRaw | ComputedColumn, defaultColumnStyles?: DefaultColumnOptions) => Column;
