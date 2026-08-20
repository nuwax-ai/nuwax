import { findLenOfColumn } from '../utils/table-helpers.js';
// All these functions are ran when renderTable/printTable is called
const createComputedColumnsIfNecessary = (table) => {
    if (table.computedColumns.length) {
        table.computedColumns.forEach((computedColumn) => {
            // This can happen if renderTable/printTable is called multiple times
            const isColumnAlreadyExists = table.columns.some((col) => col.name === computedColumn.name);
            if (isColumnAlreadyExists) {
                return;
            }
            table.addColumn({
                ...computedColumn,
                ...table.defaultColumnOptions,
            });
            table.rows.forEach((row, index, rowsArray) => {
                const arrayRowText = rowsArray.map((elemInRowsArray) => elemInRowsArray.text);
                row.text[computedColumn.name] = computedColumn.function(row.text, index, arrayRowText);
            });
        });
    }
};
const disableColumnsIfNecessary = (table) => {
    if (table.enabledColumns.length) {
        table.columns = table.columns.filter((col) => table.enabledColumns.includes(col.name));
    }
};
const enableColumnsIfNecessary = (table) => {
    if (table.disabledColumns.length) {
        table.columns = table.columns.filter((col) => !table.disabledColumns.includes(col.name));
    }
};
const findColumnWidth = (table) => {
    table.columns.forEach((column) => {
        column.length = findLenOfColumn(column, table.rows, table.charLength);
    });
};
export const preProcessColumns = (table) => {
    createComputedColumnsIfNecessary(table);
    enableColumnsIfNecessary(table);
    disableColumnsIfNecessary(table);
    findColumnWidth(table);
};
export const preProcessRows = (table) => {
    const newRows = table.rows
        .filter((r) => table.filterFunction(r.text))
        .sort((r1, r2) => table.sortFunction(r1.text, r2.text));
    table.rows = newRows;
};
