import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import $48drk$react, {useState as $48drk$useState, useMemo as $48drk$useMemo} from "react";

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


const $ea3928288112382f$var$styles = {
    border: 0,
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: '1px',
    margin: '-1px',
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    width: '1px',
    whiteSpace: 'nowrap'
};
function $ea3928288112382f$export$a966af930f325cab(props = {}) {
    let { style: style, isFocusable: isFocusable } = props;
    let [isFocused, setFocused] = (0, $48drk$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        isDisabled: !isFocusable,
        onFocusWithinChange: (val)=>setFocused(val)
    });
    // If focused, don't hide the element.
    let combinedStyles = (0, $48drk$useMemo)(()=>{
        if (isFocused) return style;
        else if (style) return {
            ...$ea3928288112382f$var$styles,
            ...style
        };
        else return $ea3928288112382f$var$styles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        isFocused
    ]);
    return {
        visuallyHiddenProps: {
            ...focusWithinProps,
            style: combinedStyles
        }
    };
}
function $ea3928288112382f$export$439d29a4e110a164(props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { children: children, elementType: Element = 'div', isFocusable: isFocusable, style: style, ...otherProps } = props;
    let { visuallyHiddenProps: visuallyHiddenProps } = $ea3928288112382f$export$a966af930f325cab(props);
    return /*#__PURE__*/ (0, $48drk$react).createElement(Element, (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(otherProps, visuallyHiddenProps), children);
}


export {$ea3928288112382f$export$a966af930f325cab as useVisuallyHidden, $ea3928288112382f$export$439d29a4e110a164 as VisuallyHidden};
//# sourceMappingURL=VisuallyHidden.mjs.map
