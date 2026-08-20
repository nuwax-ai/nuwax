import { findWidthInConsole } from './console-utils.js';
import { biggestWordInSentence, splitTextIntoTextsOfMinLen, } from './string-utils.js';
import { DEFAULT_COLUMN_LEN, DEFAULT_HEADER_FONT_COLOR, DEFAULT_ROW_SEPARATOR, } from './table-constants.js';
const max = (a, b) => Math.max(a, b);
// takes any input that is given by user and converts to string
export const cellText = (text) => text === undefined || text === null ? '' : `${text}`;
// evaluate cell text with defined transform
export const evaluateCellText = (text, transform) => (transform ? `${transform(text)}` : cellText(text));
export const convertRawRowOptionsToStandard = (options) => {
    if (options) {
        return {
            color: options.color,
            separator: options.separator || DEFAULT_ROW_SEPARATOR,
        };
    }
    return undefined;
};
// ({ left: "╚", mid: "╩", right: "╝", other: "═" }, [5, 10, 7]) => "╚═══════╩════════════╩═════════╝"
export const createTableHorizontalBorders = ({ left, mid, right, other }, column_lengths) => {
    // ╚
    let ret = left;
    // ╚═══════╩═══════════════════════════════════════╩════════╩
    column_lengths.forEach((len) => {
        ret += other.repeat(len + 2);
        ret += mid;
    });
    // ╚═══════╩═══════════════════════════════════════╩════════
    ret = ret.slice(0, -mid.length);
    // ╚═══════╩═══════════════════════════════════════╩════════╝
    ret += right;
    return ret;
};
// ("id") => { name: "id", title: "id" }
export const createColumFromOnlyName = (name) => ({
    name,
    title: name,
});
// ("green", { id: 1, name: "John" }, true) => { color: "green", separator: true, text: { id: 1, name: "John" } }
export const createRow = (color, text, separator) => ({
    color,
    separator,
    text,
});
// ({ name: "id", title: "ID", minLen: 2 }, [{ text: { id: 1 } }, { text: { id: 100 } }]) => 3
// Calculates optimal column width based on content and constraints
export const findLenOfColumn = (column, rows, charLength) => {
    const columnId = column.name;
    const columnTitle = column.title;
    const datatransform = column.transform;
    let length = max(0, column?.minLen || 0);
    if (column.maxLen) {
        // if customer input is mentioned a max width, lets see if all other can fit here
        // if others cant fit find the max word length so that at least the table can be printed
        length = max(length, max(column.maxLen, biggestWordInSentence(columnTitle, charLength)));
        length = rows.reduce((acc, row) => max(acc, biggestWordInSentence(evaluateCellText(row.text[columnId], datatransform), charLength)), length);
        return length;
    }
    length = max(length, findWidthInConsole(columnTitle, charLength));
    rows.forEach((row) => {
        length = max(length, findWidthInConsole(evaluateCellText(row.text[columnId], datatransform), charLength));
    });
    return length;
};
// ({ left: "╚", mid: "╩", right: "╝", other: "═" }, [5, 10, 7]) => "╚═══════╩════════════╩═════════╝"
// (undefined, [5, 10, 7]) => ""
export const renderTableHorizontalBorders = (style, column_lengths) => {
    const str = createTableHorizontalBorders(style, column_lengths);
    return str;
};
// (createRow, [{ name: "id", title: "ID" }, { name: "name", title: "Name" }]) =>
// { color: "white_bold", separator: false, text: { id: "ID", name: "Name" } }
export const createHeaderAsRow = (createRowFn, columns) => {
    const headerColor = DEFAULT_HEADER_FONT_COLOR;
    const row = createRowFn(headerColor, {}, false);
    columns.forEach((column) => {
        row.text[column.name] = column.title;
    });
    return row;
};
// ([{ name: "desc", length: 10 }], { text: { desc: "This is a long description" } })
// => { desc: ["This is a", "long", "description"] }
export const getWidthLimitedColumnsArray = (columns, row, charLength) => {
    const ret = {};
    columns.forEach((column) => {
        ret[column.name] = splitTextIntoTextsOfMinLen(cellText(row.text[column.name]), column.length || DEFAULT_COLUMN_LEN, charLength);
    });
    return ret;
};
