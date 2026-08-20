import React, { type ElementType, type Ref } from 'react';
import type { Props } from '../../types.js';
import { type HasDisplayName, type RefProp } from '../../utils/render.js';
declare let DEFAULT_FIELD_TAG: "div";
type FieldRenderPropArg = {};
type FieldPropsWeControl = never;
export type FieldProps<TTag extends ElementType = typeof DEFAULT_FIELD_TAG> = Props<TTag, FieldRenderPropArg, FieldPropsWeControl, {
    disabled?: boolean;
}>;
declare function FieldFn<TTag extends ElementType = typeof DEFAULT_FIELD_TAG>(props: FieldProps<TTag>, ref: Ref<HTMLElement>): React.JSX.Element;
export interface _internal_ComponentField extends HasDisplayName {
    <TTag extends ElementType = typeof DEFAULT_FIELD_TAG>(props: FieldProps<TTag> & RefProp<typeof FieldFn>): React.JSX.Element;
}
export declare let Field: _internal_ComponentField;
export {};
