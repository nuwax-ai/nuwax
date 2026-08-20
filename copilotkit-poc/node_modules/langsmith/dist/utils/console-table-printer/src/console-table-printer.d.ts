import TableInternal from './internalTable/internal-table.js';
import { Dictionary } from './models/common.js';
import { ColumnOptionsRaw, ComplexOptions } from './models/external-table.js';
import { RowOptionsRaw } from './utils/table-helpers.js';
export default class Table {
    table: TableInternal;
    constructor(options?: ComplexOptions | string[]);
    addColumn(column: string | ColumnOptionsRaw): this;
    addColumns(columns: string[] | ColumnOptionsRaw[]): this;
    addRow(text: Dictionary, rowOptions?: RowOptionsRaw): this;
    addRows(toBeInsertedRows: Dictionary[], rowOptions?: RowOptionsRaw): this;
    printTable(): void;
    render(): string;
}
