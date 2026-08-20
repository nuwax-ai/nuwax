import { DropTarget, DropTargetDelegate, Key, LayoutDelegate, Node } from '@react-types/shared';
import { InvalidationContext } from '../virtualizer/types';
import { Layout } from '../virtualizer/Layout';
import { LayoutInfo } from '../virtualizer/LayoutInfo';
import { Rect } from '../virtualizer/Rect';
import { Size } from '../virtualizer/Size';
export interface WaterfallLayoutOptions {
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
}
export declare class WaterfallLayout<T extends object, O extends WaterfallLayoutOptions = WaterfallLayoutOptions> extends Layout<Node<T>, O> implements LayoutDelegate, DropTargetDelegate {
    private contentSize;
    private layoutInfos;
    protected numColumns: number;
    protected dropIndicatorThickness: number;
    private margin;
    shouldInvalidateLayoutOptions(newOptions: O, oldOptions: O): boolean;
    update(invalidationContext: InvalidationContext<O>): void;
    getLayoutInfo(key: Key): LayoutInfo;
    getContentSize(): Size;
    getVisibleLayoutInfos(rect: Rect): LayoutInfo[];
    updateItemSize(key: Key, size: Size): boolean;
    getKeyRightOf(key: Key): Key | null;
    getKeyLeftOf(key: Key): Key | null;
    getKeyRange(from: Key, to: Key): Key[];
    getDropTargetFromPoint(x: number, y: number): DropTarget;
}
