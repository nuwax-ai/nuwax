import TableInternal from './internalTable/internal-table.js';
import { convertRawRowOptionsToStandard, } from './utils/table-helpers.js';
export default class Table {
    constructor(options) {
        Object.defineProperty(this, "table", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.table = new TableInternal(options);
    }
    addColumn(column) {
        this.table.addColumn(column);
        return this;
    }
    addColumns(columns) {
        this.table.addColumns(columns);
        return this;
    }
    addRow(text, rowOptions) {
        this.table.addRow(text, convertRawRowOptionsToStandard(rowOptions));
        return this;
    }
    addRows(toBeInsertedRows, rowOptions) {
        this.table.addRows(toBeInsertedRows, convertRawRowOptionsToStandard(rowOptions));
        return this;
    }
    printTable() {
        const tableRendered = this.table.renderTable();
        console.log(tableRendered);
    }
    render() {
        return this.table.renderTable();
    }
}
