import { ColumnSize } from './Column';
import { Key } from '@react-types/shared';
export declare function isStatic(width?: ColumnSize | null): boolean;
export declare function parseFractionalUnit(width?: ColumnSize | null): number;
export declare function parseStaticWidth(width: number | string, tableWidth: number): number;
export declare function getMaxWidth(maxWidth: number | string | null | undefined, tableWidth: number): number;
export declare function getMinWidth(minWidth: number | string, tableWidth: number): number;
export interface IColumn {
    minWidth?: number | string;
    maxWidth?: number | string;
    width?: number | string;
    defaultWidth?: number | string;
    key: Key;
}
/**
 * Implements the flex algorithm described in https://www.w3.org/TR/css-flexbox-1/#layout-algorithm
 * It makes a few constraint/assumptions: 1. All basis values are 0 unless it is a static width,
 * then the basis is the static width 2. All flex grow and shrink values are equal to the FR
 * specified on the column, grow and shrink for the same column are equal 3. We only have one row An
 * example of the setup can be seen here https://jsfiddle.net/snowystinger/wv0ymjaf/61/ where I let
 * the browser figure out the flex of the columns. Note: We differ in one key aspect, all of our
 * column widths must be whole numbers, so we avoid browser sub pixel rounding errors. To do this,
 * we use a cascading rounding algorithm to ensure that the sum of the widths is maintained while
 * distributing the rounding remainder across the columns.
 *
 * As noted in the chrome source code, this algorithm is very accurate, but has the potential to be
 * quadratic. They have deemed this to be acceptable because the number of elements is usually small
 * and the flex factors are usually not high variance. I believe we can make the same assumptions.
 * Particularly once resizing is started, it will convert all columns to the left to static widths,
 * so it will cut down on the number of FR columns.
 *
 * There are likely faster ways to do this, I've chosen to stick to the spec as closely as possible
 * for readability, accuracy, and for the note that this behaving quadratically is unlikely to be a
 * problem.
 *
 * @param availableWidth - The visible width of the table.
 * @param columns - The table defined columns.
 * @param changedColumns - Any columns we want to override, for example, during resizing.
 * @param getDefaultWidth - A function that returns the default width of a column by its index.
 * @param getDefaultMinWidth - A function that returns the default min width of a column by its
 *   index.
 */
export declare function calculateColumnSizes(availableWidth: number, columns: IColumn[], changedColumns: Map<Key, ColumnSize>, getDefaultWidth?: (index: number) => ColumnSize | null | undefined, getDefaultMinWidth?: (index: number) => ColumnSize | null | undefined): number[];
