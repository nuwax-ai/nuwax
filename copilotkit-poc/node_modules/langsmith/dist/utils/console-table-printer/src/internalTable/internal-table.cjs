"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colored_console_line_js_1 = require("../utils/colored-console-line.cjs");
const table_constants_js_1 = require("../utils/table-constants.cjs");
const table_helpers_js_1 = require("../utils/table-helpers.cjs");
const input_converter_js_1 = require("./input-converter.cjs");
const internal_table_printer_js_1 = require("./internal-table-printer.cjs");
const DEFAULT_ROW_SORT_FUNC = () => 0;
const DEFAULT_ROW_FILTER_FUNC = () => true;
class TableInternal {
    initSimple(columns) {
        this.columns = columns.map((column) => ({
            name: column,
            title: column,
            alignment: table_constants_js_1.DEFAULT_ROW_ALIGNMENT,
        }));
    }
    initDetailed(options) {
        this.title = options?.title || this.title;
        this.tableStyle = {
            ...this.tableStyle,
            ...options?.style,
        };
        this.sortFunction = options?.sort || this.sortFunction;
        this.filterFunction = options?.filter || this.filterFunction;
        this.enabledColumns = options?.enabledColumns || this.enabledColumns;
        this.disabledColumns = options?.disabledColumns || this.disabledColumns;
        this.computedColumns = options?.computedColumns || this.computedColumns;
        this.columns =
            options?.columns?.map((column) => (0, input_converter_js_1.rawColumnToInternalColumn)(column, options?.defaultColumnOptions)) || this.columns;
        this.rowSeparator = options?.rowSeparator || this.rowSeparator;
        this.charLength = options?.charLength || this.charLength;
        this.defaultColumnOptions =
            options?.defaultColumnOptions || this.defaultColumnOptions;
        if (options?.shouldDisableColors) {
            this.colorMap = {};
        }
        else if (options?.colorMap) {
            this.colorMap = { ...this.colorMap, ...options.colorMap };
        }
        if (options.rows !== undefined) {
            this.addRows(options.rows);
        }
    }
    constructor(options) {
        Object.defineProperty(this, "title", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tableStyle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "columns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rows", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filterFunction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sortFunction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "enabledColumns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "disabledColumns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "computedColumns", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rowSeparator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "colorMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "charLength", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "defaultColumnOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "transforms", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // default construction
        this.rows = [];
        this.columns = [];
        this.title = undefined;
        this.tableStyle = table_constants_js_1.DEFAULT_TABLE_STYLE;
        this.filterFunction = DEFAULT_ROW_FILTER_FUNC;
        this.sortFunction = DEFAULT_ROW_SORT_FUNC;
        this.enabledColumns = [];
        this.disabledColumns = [];
        this.computedColumns = [];
        this.rowSeparator = table_constants_js_1.DEFAULT_ROW_SEPARATOR;
        this.colorMap = colored_console_line_js_1.DEFAULT_COLOR_MAP;
        this.charLength = {};
        this.defaultColumnOptions = undefined;
        this.transforms = {};
        if (options instanceof Array) {
            this.initSimple(options);
        }
        else if (typeof options === 'object') {
            this.initDetailed(options);
        }
    }
    createColumnFromRow(text) {
        const colNames = this.columns.map((col) => col.name);
        Object.keys(text).forEach((key) => {
            if (!colNames.includes(key)) {
                this.columns.push((0, input_converter_js_1.rawColumnToInternalColumn)((0, table_helpers_js_1.createColumFromOnlyName)(key), this.defaultColumnOptions));
            }
        });
    }
    addColumn(textOrObj) {
        const columnOptionsFromInput = typeof textOrObj === 'string'
            ? (0, table_helpers_js_1.createColumFromOnlyName)(textOrObj)
            : textOrObj;
        this.columns.push((0, input_converter_js_1.rawColumnToInternalColumn)(columnOptionsFromInput, this.defaultColumnOptions));
    }
    addColumns(toBeInsertedColumns) {
        toBeInsertedColumns.forEach((toBeInsertedColumn) => {
            this.addColumn(toBeInsertedColumn);
        });
    }
    addRow(text, options) {
        this.createColumnFromRow(text);
        this.rows.push((0, table_helpers_js_1.createRow)(options?.color || table_constants_js_1.DEFAULT_ROW_FONT_COLOR, text, options?.separator !== undefined
            ? options?.separator
            : this.rowSeparator));
    }
    addRows(toBeInsertedRows, options) {
        toBeInsertedRows.forEach((toBeInsertedRow) => {
            this.addRow(toBeInsertedRow, options);
        });
    }
    renderTable() {
        return (0, internal_table_printer_js_1.renderTable)(this);
    }
}
exports.default = TableInternal;
