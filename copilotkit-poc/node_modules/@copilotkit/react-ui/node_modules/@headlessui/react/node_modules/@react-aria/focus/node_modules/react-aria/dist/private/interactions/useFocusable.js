import {focusSafely as $56c81cdebdc6a696$export$80f3e147d781571c} from "./focusSafely.js";
import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {isFocusable as $ee5e22534121197a$export$4c063cf1350e6fed} from "../utils/isFocusable.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {mergeRefs as $d49e67a55e1d0418$export$c9058316764c140e} from "../utils/mergeRefs.js";
import {useFocus as $a19d0c473b0e0cad$export$f8168d8dd8fd66e6} from "./useFocus.js";
import {useKeyboard as $bf74df7506f65576$export$8f71654801c2f7cd} from "./useKeyboard.js";
import {useObjectRef as $5f169cf7bc5a96a9$export$4338b53315abf666} from "../utils/useObjectRef.js";
import {useSyncRef as $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.js";
import $b6Mdn$react, {useContext as $b6Mdn$useContext, useRef as $b6Mdn$useRef, useEffect as $b6Mdn$useEffect, forwardRef as $b6Mdn$forwardRef} from "react";

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









let $088f27a386bc4a8f$export$f9762fab77588ecb = /*#__PURE__*/ (0, $b6Mdn$react).createContext(null);
function $088f27a386bc4a8f$var$useFocusableContext(ref) {
    let context = (0, $b6Mdn$useContext)($088f27a386bc4a8f$export$f9762fab77588ecb) || {};
    (0, $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e)(context, ref);
    // eslint-disable-next-line
    let { ref: _, ...otherProps } = context;
    return otherProps;
}
const $088f27a386bc4a8f$export$13f3202a3e5ddd5 = /*#__PURE__*/ (0, $b6Mdn$react).forwardRef(function FocusableProvider(props, ref) {
    let { children: children, ...otherProps } = props;
    let objRef = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)(ref);
    let context = {
        ...otherProps,
        ref: objRef
    };
    return /*#__PURE__*/ (0, $b6Mdn$react).createElement($088f27a386bc4a8f$export$f9762fab77588ecb.Provider, {
        value: context
    }, children);
});
function $088f27a386bc4a8f$export$4c014de7c8940b4c(props, domRef) {
    let { focusProps: focusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)(props);
    let { keyboardProps: keyboardProps } = (0, $bf74df7506f65576$export$8f71654801c2f7cd)(props);
    let interactions = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusProps, keyboardProps);
    let domProps = $088f27a386bc4a8f$var$useFocusableContext(domRef);
    let interactionProps = props.isDisabled ? {} : domProps;
    let autoFocusRef = (0, $b6Mdn$useRef)(props.autoFocus);
    (0, $b6Mdn$useEffect)(()=>{
        if (autoFocusRef.current && domRef.current) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(domRef.current);
        autoFocusRef.current = false;
    }, [
        domRef
    ]);
    // Always set a tabIndex so that Safari allows focusing native buttons and inputs.
    let tabIndex = props.excludeFromTabOrder ? -1 : 0;
    if (props.isDisabled) tabIndex = undefined;
    return {
        focusableProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)({
            ...interactions,
            tabIndex: tabIndex
        }, interactionProps)
    };
}
const $088f27a386bc4a8f$export$35a3bebf7ef2d934 = /*#__PURE__*/ (0, $b6Mdn$forwardRef)(({ children: children, ...props }, ref)=>{
    ref = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)(ref);
    let { focusableProps: focusableProps } = $088f27a386bc4a8f$export$4c014de7c8940b4c(props, ref);
    let child = (0, $b6Mdn$react).Children.only(children);
    (0, $b6Mdn$useEffect)(()=>{
        if (process.env.NODE_ENV === 'production') return;
        let el = ref.current;
        if (!el || !(el instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(el).Element)) {
            console.error('<Focusable> child must forward its ref to a DOM element.');
            return;
        }
        if (!props.isDisabled && !(0, $ee5e22534121197a$export$4c063cf1350e6fed)(el)) {
            console.warn('<Focusable> child must be focusable. Please ensure the tabIndex prop is passed through.');
            return;
        }
        if (el.localName !== 'button' && el.localName !== 'input' && el.localName !== 'select' && el.localName !== 'textarea' && el.localName !== 'a' && el.localName !== 'area' && el.localName !== 'summary' && el.localName !== 'img' && el.localName !== 'svg') {
            let role = el.getAttribute('role');
            if (!role) console.warn('<Focusable> child must have an interactive ARIA role.');
            else if (// https://w3c.github.io/aria/#widget_roles
            role !== 'application' && role !== 'button' && role !== 'checkbox' && role !== 'combobox' && role !== 'gridcell' && role !== 'link' && role !== 'menuitem' && role !== 'menuitemcheckbox' && role !== 'menuitemradio' && role !== 'option' && role !== 'radio' && role !== 'searchbox' && role !== 'separator' && role !== 'slider' && role !== 'spinbutton' && role !== 'switch' && role !== 'tab' && role !== 'tabpanel' && role !== 'textbox' && role !== 'treeitem' && // aria-describedby is also announced on these roles
            role !== 'img' && role !== 'meter' && role !== 'progressbar') console.warn(`<Focusable> child must have an interactive ARIA role. Got "${role}".`);
        }
    }, [
        ref,
        props.isDisabled
    ]);
    // @ts-ignore
    let childRef = parseInt((0, $b6Mdn$react).version, 10) < 19 ? child.ref : child.props.ref;
    return /*#__PURE__*/ (0, $b6Mdn$react).cloneElement(child, {
        ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(focusableProps, child.props),
        // @ts-ignore
        ref: (0, $d49e67a55e1d0418$export$c9058316764c140e)(childRef, ref)
    });
});


export {$088f27a386bc4a8f$export$f9762fab77588ecb as FocusableContext, $088f27a386bc4a8f$export$13f3202a3e5ddd5 as FocusableProvider, $088f27a386bc4a8f$export$4c014de7c8940b4c as useFocusable, $088f27a386bc4a8f$export$35a3bebf7ef2d934 as Focusable};
//# sourceMappingURL=useFocusable.js.map
