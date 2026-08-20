import ColoredConsoleLine from '../utils/colored-console-line.js';
import { textWithPadding } from '../utils/string-utils.js';
import { DEFAULT_COLUMN_LEN, DEFAULT_HEADER_ALIGNMENT, DEFAULT_HEADER_FONT_COLOR, DEFAULT_ROW_ALIGNMENT, DEFAULT_ROW_FONT_COLOR, } from '../utils/table-constants.js';
import { cellText, createHeaderAsRow, createRow, getWidthLimitedColumnsArray, renderTableHorizontalBorders, } from '../utils/table-helpers.js';
import TableInternal from './internal-table.js';
import { preProcessColumns, preProcessRows } from './table-pre-processors.js';
// ║ Index ║         ║        ║
const renderOneLine = (tableStyle, columns, currentLineIndex, widthLimitedColumnsArray, isHeader, row, colorMap, charLength) => {
    const line = new ColoredConsoleLine(colorMap);
    line.addCharsWithColor('', tableStyle.vertical); // dont Color the Column borders
    columns.forEach((column) => {
        const thisLineHasText = currentLineIndex < widthLimitedColumnsArray[column.name].length;
        const textForThisLine = thisLineHasText
            ? cellText(widthLimitedColumnsArray[column.name][currentLineIndex])
            : '';
        line.addCharsWithColor(DEFAULT_ROW_FONT_COLOR, ' ');
        line.addCharsWithColor((isHeader && DEFAULT_HEADER_FONT_COLOR) || column.color || row.color, textWithPadding(textForThisLine, column.alignment || DEFAULT_ROW_ALIGNMENT, column.length || DEFAULT_COLUMN_LEN, charLength));
        line.addCharsWithColor('', ` ${tableStyle.vertical}`); // dont Color the Column borders
    });
    return line.renderConsole();
};
// ║ Bold  ║    text ║  value ║
// ║ Index ║         ║        ║
const renderWidthLimitedLines = (tableStyle, columns, row, colorMap, isHeader, charLength) => {
    // { col1: ['How', 'Is', 'Going'], col2: ['I am', 'Tom'],  }
    const widthLimitedColumnsArray = getWidthLimitedColumnsArray(columns, row, charLength);
    const totalLines = Object.values(widthLimitedColumnsArray).reduce((a, b) => Math.max(a, b.length), 0);
    const ret = [];
    for (let currentLineIndex = 0; currentLineIndex < totalLines; currentLineIndex += 1) {
        const singleLine = renderOneLine(tableStyle, columns, currentLineIndex, widthLimitedColumnsArray, isHeader, row, colorMap, charLength);
        ret.push(singleLine);
    }
    return ret;
};
const transformRow = (row, columns) => {
    const transformedRow = JSON.parse(JSON.stringify(row));
    const transforms = {};
    columns
        .filter((c) => {
        return !!c.transform;
    })
        .forEach((c) => {
        transforms[c.name] = c.transform;
    });
    Object.keys(transforms).forEach((t) => {
        transformedRow.text[t] = transforms[t](transformedRow.text[t]);
    });
    return transformedRow;
};
// ║ 1     ║     I would like some red wine please ║ 10.212 ║
const renderRow = (table, row) => {
    let ret = [];
    const transformedRow = transformRow(row, table.columns);
    ret = ret.concat(renderWidthLimitedLines(table.tableStyle, table.columns, transformedRow, table.colorMap, undefined, table.charLength));
    return ret;
};
/*
                  The analysis Result
 ╔═══════╦═══════════════════════════════════════╦════════╗
*/
const renderTableTitle = (table) => {
    const ret = [];
    if (table.title === undefined) {
        return ret;
    }
    const getTableWidth = () => {
        const reducer = (accumulator, currentValue) => 
        // ║ cell ║, 2 spaces + cellTextSize + one border on the left
        accumulator + currentValue + 2 + 1;
        return table.columns
            .map((m) => m.length || DEFAULT_COLUMN_LEN)
            .reduce(reducer, 1);
    };
    const titleWithPadding = textWithPadding(table.title, DEFAULT_HEADER_ALIGNMENT, getTableWidth());
    const styledText = new ColoredConsoleLine(table.colorMap);
    styledText.addCharsWithColor(DEFAULT_HEADER_FONT_COLOR, titleWithPadding);
    //                  The analysis Result
    ret.push(styledText.renderConsole());
    return ret;
};
/*
 ╔═══════╦═══════════════════════════════════════╦════════╗
 ║ index ║                                  text ║  value ║
 ╟═══════╬═══════════════════════════════════════╬════════╢
*/
const renderTableHeaders = (table) => {
    let ret = [];
    // ╔═══════╦═══════════════════════════════════════╦════════╗
    ret.push(renderTableHorizontalBorders(table.tableStyle.headerTop, table.columns.map((m) => m.length || DEFAULT_COLUMN_LEN)));
    // ║ index ║                                  text ║  value ║
    const row = createHeaderAsRow(createRow, table.columns);
    ret = ret.concat(renderWidthLimitedLines(table.tableStyle, table.columns, row, table.colorMap, true));
    // ╟═══════╬═══════════════════════════════════════╬════════╢
    ret.push(renderTableHorizontalBorders(table.tableStyle.headerBottom, table.columns.map((m) => m.length || DEFAULT_COLUMN_LEN)));
    return ret;
};
const renderTableEnding = (table) => {
    const ret = [];
    // ╚═══════╩═══════════════════════════════════════╩════════╝
    ret.push(renderTableHorizontalBorders(table.tableStyle.tableBottom, table.columns.map((m) => m.length || DEFAULT_COLUMN_LEN)));
    return ret;
};
const renderRowSeparator = (table, row) => {
    const ret = [];
    const lastRowIndex = table.rows.length - 1;
    const currentRowIndex = table.rows.indexOf(row);
    if (currentRowIndex !== lastRowIndex && row.separator) {
        // ╟═══════╬═══════════════════════════════════════╬════════╢
        ret.push(renderTableHorizontalBorders(table.tableStyle.rowSeparator, table.columns.map((m) => m.length || DEFAULT_COLUMN_LEN)));
    }
    return ret;
};
export const renderTable = (table) => {
    preProcessColumns(table); // enable / disable cols, find maxLn of each col/ computed Columns
    preProcessRows(table); // sort and filter
    const ret = [];
    renderTableTitle(table).forEach((row) => ret.push(row));
    renderTableHeaders(table).forEach((row) => ret.push(row));
    table.rows.forEach((row) => {
        renderRow(table, row).forEach((row_) => ret.push(row_));
        renderRowSeparator(table, row).forEach((row_) => ret.push(row_));
    });
    renderTableEnding(table).forEach((row) => ret.push(row));
    return ret.join('\n');
};
export const renderSimpleTable = (rows, tableOptions) => {
    const table = new TableInternal(tableOptions);
    table.addRows(rows);
    return renderTable(table);
};
export const printSimpleTable = (rows, tableOptions) => {
    console.log(renderSimpleTable(rows, tableOptions));
};
