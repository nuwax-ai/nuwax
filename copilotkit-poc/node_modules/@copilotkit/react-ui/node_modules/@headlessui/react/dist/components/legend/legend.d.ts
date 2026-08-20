import React, { type ElementType, type Ref } from 'react';
import type { Props } from '../../types.js';
import { type HasDisplayName, type RefProp } from '../../utils/render.js';
declare let DEFAULT_LEGEND_TAG: import('../label/label.js')._internal_ComponentLabel;
type LegendRenderPropArg = {};
type LegendPropsWeControl = never;
export type LegendProps<TTag extends ElementType = typeof DEFAULT_LEGEND_TAG> = Props<TTag, LegendRenderPropArg, LegendPropsWeControl, {}>;
declare function LegendFn<TTag extends ElementType = typeof DEFAULT_LEGEND_TAG>(props: LegendProps<TTag>, ref: Ref<HTMLElement>): React.JSX.Element;
export interface _internal_ComponentLegend extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_LEGEND_TAG>(props: LegendProps<TTag> & RefProp<typeof LegendFn>): React.JSX.Element;
}
export declare let Legend: _internal_ComponentLegend;
export {};
