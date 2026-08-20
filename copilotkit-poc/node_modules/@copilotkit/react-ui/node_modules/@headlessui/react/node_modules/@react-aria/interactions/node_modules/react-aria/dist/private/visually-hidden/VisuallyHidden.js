import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import $6jIEV$react, {useState as $6jIEV$useState, useMemo as $6jIEV$useMemo} from "react";

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


const $6947385881e3ae0e$var$styles = {
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
function $6947385881e3ae0e$export$a966af930f325cab(props = {}) {
    let { style: style, isFocusable: isFocusable } = props;
    let [isFocused, setFocused] = (0, $6jIEV$useState)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        isDisabled: !isFocusable,
        onFocusWithinChange: (val)=>setFocused(val)
    });
    // If focused, don't hide the element.
    let combinedStyles = (0, $6jIEV$useMemo)(()=>{
        if (isFocused) return style;
        else if (style) return {
            ...$6947385881e3ae0e$var$styles,
            ...style
        };
        else return $6947385881e3ae0e$var$styles;
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
function $6947385881e3ae0e$export$439d29a4e110a164(props) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let { children: children, elementType: Element = 'div', isFocusable: isFocusable, style: style, ...otherProps } = props;
    let { visuallyHiddenProps: visuallyHiddenProps } = $6947385881e3ae0e$export$a966af930f325cab(props);
    return /*#__PURE__*/ (0, $6jIEV$react).createElement(Element, (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(otherProps, visuallyHiddenProps), children);
}


export {$6947385881e3ae0e$export$a966af930f325cab as useVisuallyHidden, $6947385881e3ae0e$export$439d29a4e110a164 as VisuallyHidden};
//# sourceMappingURL=VisuallyHidden.js.map
