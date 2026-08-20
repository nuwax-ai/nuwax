"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawColumnToInternalColumn = exports.objIfExists = void 0;
const table_constants_js_1 = require("../utils/table-constants.cjs");
const objIfExists = (key, val) => {
    if (!val) {
        return {};
    }
    return {
        [key]: val,
    };
};
exports.objIfExists = objIfExists;
const rawColumnToInternalColumn = (column, defaultColumnStyles) => ({
    name: column.name,
    title: column.title ?? column.name,
    ...(0, exports.objIfExists)('color', (column.color || defaultColumnStyles?.color)),
    ...(0, exports.objIfExists)('maxLen', (column.maxLen || defaultColumnStyles?.maxLen)),
    ...(0, exports.objIfExists)('minLen', (column.minLen || defaultColumnStyles?.minLen)),
    alignment: (column.alignment ||
        defaultColumnStyles?.alignment ||
        table_constants_js_1.DEFAULT_ROW_ALIGNMENT),
    transform: column.transform,
});
exports.rawColumnToInternalColumn = rawColumnToInternalColumn;
