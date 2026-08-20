import { DropTarget, DropTargetDelegate, ItemDropTarget, Key, Node } from '@react-types/shared';
import { InvalidationContext } from '../virtualizer/types';
import { Layout } from '../virtualizer/Layout';
import { LayoutInfo } from '../virtualizer/LayoutInfo';
import { Rect } from '../virtualizer/Rect';
import { Size } from '../virtualizer/Size';
export interface GridLayoutOptions {
    /**
     * The minimum item size.
     *
     * @default 200 x 200
     */
    minItemSize?: Size;
    /**
     * The maximum item size.
     *
     * @default Infinity
     */
    maxItemSize?: Size;
    /**
     * Whether to preserve the aspect ratio of the `minItemSize`.
     * By default, grid rows may have variable heights. When `preserveAspectRatio`
     * is true, all rows will have equal heights.
     *
     * @default false
     */
    preserveAspectRatio?: boolean;
    /**
     * The minimum space required between items.
     *
     * @default 18 x 18
     */
    minSpace?: Size;
    /**
     * The maximum allowed horizontal space between items.
     *
     * @default Infinity
     */
    maxHorizontalSpace?: number;
    /**
     * The maximum number of columns.
     *
     * @default Infinity
     */
    maxColumns?: number;
    /**
     * The thickness of the drop indicator.
     *
     * @default 2
     */
    dropIndicatorThickness?: number;
    /**
     * The fixed height of a loader element in px. This loader is specifically for "load more"
     * elements rendered when loading more rows at the root level or inside nested row/sections.
     *
     * @default 48
     */
    loaderHeight?: number;
    /**
     * The layout direction. When `'rtl'`, drop target positions (`'before'`/`'after'`)
     * are computed correctly for right-to-left locales in multi-column grids.
     *
     * @default 'ltr'
     */
    direction?: 'ltr' | 'rtl';
}
/**
 * GridLayout is a virtualizer Layout implementation
 * that arranges its items in a grid.
 * The items are sized between a minimum and maximum size
 * depending on the width of the container.
 */
export declare class GridLayout<T, O extends GridLayoutOptions = GridLayoutOptions> extends Layout<Node<T>, O> implements DropTargetDelegate {
    protected gap: Size;
    protected dropIndicatorThickness: number;
    protected numColumns: number;
    protected direction: 'ltr' | 'rtl';
    private contentSize;
    private layoutInfos;
    private margin;
    shouldInvalidateLayoutOptions(newOptions: O, oldOptions: O): boolean;
    update(invalidationContext: InvalidationContext<O>): void;
    getLayoutInfo(key: Key): LayoutInfo | null;
    getContentSize(): Size;
    getVisibleLayoutInfos(rect: Rect): LayoutInfo[];
    updateItemSize(key: Key, size: Size): boolean;
    getDropTargetFromPoint(x: number, y: number, isValidDropTarget: (target: DropTarget) => boolean): DropTarget;
    getDropTargetLayoutInfo(target: ItemDropTarget): LayoutInfo;
}
