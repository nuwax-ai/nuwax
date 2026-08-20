import {focusSafely as $f192c2f16961cbe0$export$80f3e147d781571c} from "./focusSafely.mjs";
import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {isFocusable as $3b8b240c1bf84ab9$export$4c063cf1350e6fed} from "../utils/isFocusable.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {mergeRefs as $4064df0d6f9620e1$export$c9058316764c140e} from "../utils/mergeRefs.mjs";
import {useFocus as $1e74c67db218ce67$export$f8168d8dd8fd66e6} from "./useFocus.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "./useKeyboard.mjs";
import {useObjectRef as $03e8ab2d84d7657a$export$4338b53315abf666} from "../utils/useObjectRef.mjs";
import {useSyncRef as $b7115c395c64f7b5$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.mjs";
import $fKWKs$react, {useContext as $fKWKs$useContext, useRef as $fKWKs$useRef, useEffect as $fKWKs$useEffect, forwardRef as $fKWKs$forwardRef} from "react";

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









let $d1116acdf220c2da$export$f9762fab77588ecb = /*#__PURE__*/ (0, $fKWKs$react).createContext(null);
function $d1116acdf220c2da$var$useFocusableContext(ref) {
    let context = (0, $fKWKs$useContext)($d1116acdf220c2da$export$f9762fab77588ecb) || {};
    (0, $b7115c395c64f7b5$export$4debdb1a3f0fa79e)(context, ref);
    // eslint-disable-next-line
    let { ref: _, ...otherProps } = context;
    return otherProps;
}
const $d1116acdf220c2da$export$13f3202a3e5ddd5 = /*#__PURE__*/ (0, $fKWKs$react).forwardRef(function FocusableProvider(props, ref) {
    let { children: children, ...otherProps } = props;
    let objRef = (0, $03e8ab2d84d7657a$export$4338b53315abf666)(ref);
    let context = {
        ...otherProps,
        ref: objRef
    };
    return /*#__PURE__*/ (0, $fKWKs$react).createElement($d1116acdf220c2da$export$f9762fab77588ecb.Provider, {
        value: context
    }, children);
});
function $d1116acdf220c2da$export$4c014de7c8940b4c(props, domRef) {
    let { focusProps: focusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)(props);
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)(props);
    let interactions = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusProps, keyboardProps);
    let domProps = $d1116acdf220c2da$var$useFocusableContext(domRef);
    let interactionProps = props.isDisabled ? {} : domProps;
    let autoFocusRef = (0, $fKWKs$useRef)(props.autoFocus);
    (0, $fKWKs$useEffect)(()=>{
        if (autoFocusRef.current && domRef.current) (0, $f192c2f16961cbe0$export$80f3e147d781571c)(domRef.current);
        autoFocusRef.current = false;
    }, [
        domRef
    ]);
    // Always set a tabIndex so that Safari allows focusing native buttons and inputs.
    let tabIndex = props.excludeFromTabOrder ? -1 : 0;
    if (props.isDisabled) tabIndex = undefined;
    return {
        focusableProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)({
            ...interactions,
            tabIndex: tabIndex
        }, interactionProps)
    };
}
const $d1116acdf220c2da$export$35a3bebf7ef2d934 = /*#__PURE__*/ (0, $fKWKs$forwardRef)(({ children: children, ...props }, ref)=>{
    ref = (0, $03e8ab2d84d7657a$export$4338b53315abf666)(ref);
    let { focusableProps: focusableProps } = $d1116acdf220c2da$export$4c014de7c8940b4c(props, ref);
    let child = (0, $fKWKs$react).Children.only(children);
    (0, $fKWKs$useEffect)(()=>{
        if (process.env.NODE_ENV === 'production') return;
        let el = ref.current;
        if (!el || !(el instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(el).Element)) {
            console.error('<Focusable> child must forward its ref to a DOM element.');
            return;
        }
        if (!props.isDisabled && !(0, $3b8b240c1bf84ab9$export$4c063cf1350e6fed)(el)) {
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
    let childRef = parseInt((0, $fKWKs$react).version, 10) < 19 ? child.ref : child.props.ref;
    return /*#__PURE__*/ (0, $fKWKs$react).cloneElement(child, {
        ...(0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, child.props),
        // @ts-ignore
        ref: (0, $4064df0d6f9620e1$export$c9058316764c140e)(childRef, ref)
    });
});


export {$d1116acdf220c2da$export$f9762fab77588ecb as FocusableContext, $d1116acdf220c2da$export$13f3202a3e5ddd5 as FocusableProvider, $d1116acdf220c2da$export$4c014de7c8940b4c as useFocusable, $d1116acdf220c2da$export$35a3bebf7ef2d934 as Focusable};
//# sourceMappingURL=useFocusable.mjs.map
