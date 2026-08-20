import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {isFocusable as $ee5e22534121197a$export$4c063cf1350e6fed} from "../utils/isFocusable.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {mergeRefs as $d49e67a55e1d0418$export$c9058316764c140e} from "../utils/mergeRefs.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "./usePress.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "./useFocusable.js";
import {useObjectRef as $5f169cf7bc5a96a9$export$4338b53315abf666} from "../utils/useObjectRef.js";
import $gj0kG$react, {useEffect as $gj0kG$useEffect} from "react";

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







const $79e5e09f1d29e3c3$export$27c701ed9e449e99 = /*#__PURE__*/ (0, $gj0kG$react).forwardRef(({ children: children, ...props }, ref)=>{
    ref = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)(ref);
    let { pressProps: pressProps } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        ...props,
        ref: ref
    });
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)(props, ref);
    let child = (0, $gj0kG$react).Children.only(children);
    (0, $gj0kG$useEffect)(()=>{
        if (process.env.NODE_ENV === 'production') return;
        let el = ref.current;
        if (!el || !(el instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(el).Element)) {
            console.error('<Pressable> child must forward its ref to a DOM element.');
            return;
        }
        if (!props.isDisabled && !(0, $ee5e22534121197a$export$4c063cf1350e6fed)(el)) {
            console.warn('<Pressable> child must be focusable. Please ensure the tabIndex prop is passed through.');
            return;
        }
        if (el.localName !== 'button' && el.localName !== 'input' && el.localName !== 'select' && el.localName !== 'textarea' && el.localName !== 'a' && el.localName !== 'area' && el.localName !== 'summary') {
            let role = el.getAttribute('role');
            if (!role) console.warn('<Pressable> child must have an interactive ARIA role.');
            else if (// https://w3c.github.io/aria/#widget_roles
            role !== 'application' && role !== 'button' && role !== 'checkbox' && role !== 'combobox' && role !== 'gridcell' && role !== 'link' && role !== 'menuitem' && role !== 'menuitemcheckbox' && role !== 'menuitemradio' && role !== 'option' && role !== 'radio' && role !== 'searchbox' && role !== 'separator' && role !== 'slider' && role !== 'spinbutton' && role !== 'switch' && role !== 'tab' && role !== 'textbox' && role !== 'treeitem') console.warn(`<Pressable> child must have an interactive ARIA role. Got "${role}".`);
        }
    }, [
        ref,
        props.isDisabled
    ]);
    // @ts-ignore
    let childRef = parseInt((0, $gj0kG$react).version, 10) < 19 ? child.ref : child.props.ref;
    return /*#__PURE__*/ (0, $gj0kG$react).cloneElement(child, {
        ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(pressProps, focusableProps, child.props),
        // @ts-ignore
        ref: (0, $d49e67a55e1d0418$export$c9058316764c140e)(childRef, ref)
    });
});


export {$79e5e09f1d29e3c3$export$27c701ed9e449e99 as Pressable};
//# sourceMappingURL=Pressable.js.map
