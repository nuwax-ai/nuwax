import {useGridList as $386a4c16c0702f9d$export$664f9155035607eb} from "../gridlist/useGridList.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {ListKeyboardDelegate as $abb04fbee71f000f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useState as $dt1Bw$useState, useRef as $dt1Bw$useRef, useEffect as $dt1Bw$useEffect} from "react";

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







const $59dfe17bbf61b558$export$653eddfc964b0f8a = new WeakMap();
function $59dfe17bbf61b558$export$4f8b5cda58b7e8ff(props, state, ref) {
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let keyboardDelegate = props.keyboardDelegate || new (0, $abb04fbee71f000f$export$a05409b8bb224a5a)({
        collection: state.collection,
        ref: ref,
        orientation: 'horizontal',
        direction: direction,
        disabledKeys: state.disabledKeys,
        disabledBehavior: state.selectionManager.disabledBehavior
    });
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span'
    });
    let { gridProps: gridProps } = (0, $386a4c16c0702f9d$export$664f9155035607eb)({
        ...props,
        ...fieldProps,
        keyboardDelegate: keyboardDelegate,
        shouldFocusWrap: true,
        linkBehavior: 'override',
        keyboardNavigationBehavior: 'tab'
    }, state, ref);
    let [isFocusWithin, setFocusWithin] = (0, $dt1Bw$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        onFocusWithinChange: setFocusWithin
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    // If the last tag is removed, focus the container.
    let prevCount = (0, $dt1Bw$useRef)(state.collection.size);
    (0, $dt1Bw$useEffect)(()=>{
        if (ref.current && prevCount.current > 0 && state.collection.size === 0 && isFocusWithin) ref.current.focus();
        prevCount.current = state.collection.size;
    }, [
        state.collection.size,
        isFocusWithin,
        ref
    ]);
    $59dfe17bbf61b558$export$653eddfc964b0f8a.set(state, {
        onRemove: props.onRemove
    });
    return {
        gridProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(gridProps, domProps, {
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


export {$59dfe17bbf61b558$export$653eddfc964b0f8a as hookData, $59dfe17bbf61b558$export$4f8b5cda58b7e8ff as useTagGroup};
//# sourceMappingURL=useTagGroup.js.map
