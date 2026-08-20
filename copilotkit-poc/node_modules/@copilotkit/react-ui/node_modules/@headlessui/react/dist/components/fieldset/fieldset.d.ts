import React, { type ElementType, type Ref } from 'react';
import type { Props } from '../../types.js';
import { type HasDisplayName, type RefProp } from '../../utils/render.js';
declare let DEFAULT_FIELDSET_TAG: "fieldset";
type FieldsetRenderPropArg = {};
type FieldsetPropsWeControl = 'aria-labelledby' | 'aria-disabled' | 'role';
export type FieldsetProps<TTag extends ElementType = typeof DEFAULT_FIELDSET_TAG> = Props<TTag, FieldsetRenderPropArg, FieldsetPropsWeControl, {
    disabled?: boolean;
}>;
declare function FieldsetFn<TTag extends ElementType = typeof DEFAULT_FIELDSET_TAG>(props: FieldsetProps<TTag>, ref: Ref<HTMLElement>): React.JSX.Element;
export interface _internal_ComponentFieldset extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_FIELDSET_TAG>(props: FieldsetProps<TTag> & RefProp<typeof FieldsetFn>): React.JSX.Element;
}
export declare let Fieldset: _internal_ComponentFieldset;
export {};
