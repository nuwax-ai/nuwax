export const DEFAULT_COLUMN_LEN = 20;
export const DEFAULT_ROW_SEPARATOR = false;
export const DEFAULT_TABLE_STYLE = {
    /*
        Default Style
        ┌────────────┬─────┬──────┐
        │ foo        │ bar │ baz  │
        │ frobnicate │ bar │ quuz │
        └────────────┴─────┴──────┘
        */
    headerTop: {
        left: '┌',
        mid: '┬',
        right: '┐',
        other: '─',
    },
    headerBottom: {
        left: '├',
        mid: '┼',
        right: '┤',
        other: '─',
    },
    tableBottom: {
        left: '└',
        mid: '┴',
        right: '┘',
        other: '─',
    },
    vertical: '│',
    rowSeparator: {
        left: '├',
        mid: '┼',
        right: '┤',
        other: '─',
    },
};
export const ALIGNMENTS = ['right', 'left', 'center'];
export const COLORS = [
    'red',
    'green',
    'yellow',
    'white',
    'blue',
    'magenta',
    'cyan',
    'white_bold',
    'reset',
];
export const DEFAULT_ROW_FONT_COLOR = 'white';
export const DEFAULT_HEADER_FONT_COLOR = 'white_bold';
export const DEFAULT_ROW_ALIGNMENT = 'right';
export const DEFAULT_HEADER_ALIGNMENT = 'center';
