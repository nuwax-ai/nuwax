import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {isFocusable as $3b8b240c1bf84ab9$export$4c063cf1350e6fed} from "../utils/isFocusable.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {mergeRefs as $4064df0d6f9620e1$export$c9058316764c140e} from "../utils/mergeRefs.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "./usePress.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "./useFocusable.mjs";
import {useObjectRef as $03e8ab2d84d7657a$export$4338b53315abf666} from "../utils/useObjectRef.mjs";
import $bliEe$react, {useEffect as $bliEe$useEffect} from "react";

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







const $15e7830bf6471d45$export$27c701ed9e449e99 = /*#__PURE__*/ (0, $bliEe$react).forwardRef(({ children: children, ...props }, ref)=>{
    ref = (0, $03e8ab2d84d7657a$export$4338b53315abf666)(ref);
    let { pressProps: pressProps } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
        ...props,
        ref: ref
    });
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)(props, ref);
    let child = (0, $bliEe$react).Children.only(children);
    (0, $bliEe$useEffect)(()=>{
        if (process.env.NODE_ENV === 'production') return;
        let el = ref.current;
        if (!el || !(el instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(el).Element)) {
            console.error('<Pressable> child must forward its ref to a DOM element.');
            return;
        }
        if (!props.isDisabled && !(0, $3b8b240c1bf84ab9$export$4c063cf1350e6fed)(el)) {
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
    let childRef = parseInt((0, $bliEe$react).version, 10) < 19 ? child.ref : child.props.ref;
    return /*#__PURE__*/ (0, $bliEe$react).cloneElement(child, {
        ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(pressProps, focusableProps, child.props),
        // @ts-ignore
        ref: (0, $4064df0d6f9620e1$export$c9058316764c140e)(childRef, ref)
    });
});


export {$15e7830bf6471d45$export$27c701ed9e449e99 as Pressable};
//# sourceMappingURL=Pressable.mjs.map
