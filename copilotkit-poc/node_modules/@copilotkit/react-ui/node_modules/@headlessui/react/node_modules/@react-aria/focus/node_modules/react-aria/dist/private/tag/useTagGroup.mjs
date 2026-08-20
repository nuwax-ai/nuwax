import {useGridList as $34d813d3524a584a$export$664f9155035607eb} from "../gridlist/useGridList.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {ListKeyboardDelegate as $ae8f8d98b2b18f2f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useField as $191c9b6d48a0a4e2$export$294aa081a6c6f55d} from "../label/useField.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useState as $h2EAl$useState, useRef as $h2EAl$useRef, useEffect as $h2EAl$useEffect} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 







const $223860f9cb8a07a2$export$653eddfc964b0f8a = new WeakMap();
function $223860f9cb8a07a2$export$4f8b5cda58b7e8ff(props, state, ref) {
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let keyboardDelegate = props.keyboardDelegate || new (0, $ae8f8d98b2b18f2f$export$a05409b8bb224a5a)({
        collection: state.collection,
        ref: ref,
        orientation: 'horizontal',
        direction: direction,
        disabledKeys: state.disabledKeys,
        disabledBehavior: state.selectionManager.disabledBehavior
    });
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $191c9b6d48a0a4e2$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span'
    });
    let { gridProps: gridProps } = (0, $34d813d3524a584a$export$664f9155035607eb)({
        ...props,
        ...fieldProps,
        keyboardDelegate: keyboardDelegate,
        shouldFocusWrap: true,
        linkBehavior: 'override',
        keyboardNavigationBehavior: 'tab'
    }, state, ref);
    let [isFocusWithin, setFocusWithin] = (0, $h2EAl$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        onFocusWithinChange: setFocusWithin
    });
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props);
    // If the last tag is removed, focus the container.
    let prevCount = (0, $h2EAl$useRef)(state.collection.size);
    (0, $h2EAl$useEffect)(()=>{
        if (ref.current && prevCount.current > 0 && state.collection.size === 0 && isFocusWithin) ref.current.focus();
        prevCount.current = state.collection.size;
    }, [
        state.collection.size,
        isFocusWithin,
        ref
    ]);
    $223860f9cb8a07a2$export$653eddfc964b0f8a.set(state, {
        onRemove: props.onRemove
    });
    return {
        gridProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(gridProps, domProps, {
            role: state.collection.size ? 'grid' : 'group',
            'aria-atomic': false,
            'aria-relevant': 'additions',
            'aria-live': isFocusWithin ? 'polite' : 'off',
            ...focusWithinProps,
            ...fieldProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps
    };
}


export {$223860f9cb8a07a2$export$653eddfc964b0f8a as hookData, $223860f9cb8a07a2$export$4f8b5cda58b7e8ff as useTagGroup};
//# sourceMappingURL=useTagGroup.mjs.map
