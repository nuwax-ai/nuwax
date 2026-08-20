"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTable = exports.printTable = exports.Table = void 0;
const console_table_printer_js_1 = __importDefault(require("./src/console-table-printer.cjs"));
exports.Table = console_table_printer_js_1.default;
const internal_table_printer_js_1 = require("./src/internalTable/internal-table-printer.cjs");
Object.defineProperty(exports, "printTable", { enumerable: true, get: function () { return internal_table_printer_js_1.printSimpleTable; } });
Object.defineProperty(exports, "renderTable", { enumerable: true, get: function () { return internal_table_printer_js_1.renderSimpleTable; } });
