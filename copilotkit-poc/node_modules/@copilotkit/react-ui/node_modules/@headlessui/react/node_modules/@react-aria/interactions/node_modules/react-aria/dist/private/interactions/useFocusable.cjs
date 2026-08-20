var $4a053a4bf25e52fb$exports = require("./focusSafely.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $48f566b6becd50da$exports = require("../utils/isFocusable.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $8b3af019b8cf786c$exports = require("../utils/mergeRefs.cjs");
var $5e1a09eb20a4a484$exports = require("./useFocus.cjs");
var $6d2f10bb8b359da5$exports = require("./useKeyboard.cjs");
var $d3019c77b88650e9$exports = require("../utils/useObjectRef.cjs");
var $4a79f3400029329d$exports = require("../utils/useSyncRef.cjs");
var $36KMZ$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "FocusableContext", function () { return $cfe896014413cb8c$export$f9762fab77588ecb; });
$parcel$export(module.exports, "FocusableProvider", function () { return $cfe896014413cb8c$export$13f3202a3e5ddd5; });
$parcel$export(module.exports, "useFocusable", function () { return $cfe896014413cb8c$export$4c014de7c8940b4c; });
$parcel$export(module.exports, "Focusable", function () { return $cfe896014413cb8c$export$35a3bebf7ef2d934; });
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









let $cfe896014413cb8c$export$f9762fab77588ecb = /*#__PURE__*/ (0, ($parcel$interopDefault($36KMZ$react))).createContext(null);
function $cfe896014413cb8c$var$useFocusableContext(ref) {
    let context = (0, $36KMZ$react.useContext)($cfe896014413cb8c$export$f9762fab77588ecb) || {};
    (0, $4a79f3400029329d$exports.useSyncRef)(context, ref);
    // eslint-disable-next-line
    let { ref: _, ...otherProps } = context;
    return otherProps;
}
const $cfe896014413cb8c$export$13f3202a3e5ddd5 = /*#__PURE__*/ (0, ($parcel$interopDefault($36KMZ$react))).forwardRef(function FocusableProvider(props, ref) {
    let { children: children, ...otherProps } = props;
    let objRef = (0, $d3019c77b88650e9$exports.useObjectRef)(ref);
    let context = {
        ...otherProps,
        ref: objRef
    };
    return /*#__PURE__*/ (0, ($parcel$interopDefault($36KMZ$react))).createElement($cfe896014413cb8c$export$f9762fab77588ecb.Provider, {
        value: context
    }, children);
});
function $cfe896014413cb8c$export$4c014de7c8940b4c(props, domRef) {
    let { focusProps: focusProps } = (0, $5e1a09eb20a4a484$exports.useFocus)(props);
    let { keyboardProps: keyboardProps } = (0, $6d2f10bb8b359da5$exports.useKeyboard)(props);
    let interactions = (0, $89b39774f3b79dbb$exports.mergeProps)(focusProps, keyboardProps);
    let domProps = $cfe896014413cb8c$var$useFocusableContext(domRef);
    let interactionProps = props.isDisabled ? {} : domProps;
    let autoFocusRef = (0, $36KMZ$react.useRef)(props.autoFocus);
    (0, $36KMZ$react.useEffect)(()=>{
        if (autoFocusRef.current && domRef.current) (0, $4a053a4bf25e52fb$exports.focusSafely)(domRef.current);
        autoFocusRef.current = false;
    }, [
        domRef
    ]);
    // Always set a tabIndex so that Safari allows focusing native buttons and inputs.
    let tabIndex = props.excludeFromTabOrder ? -1 : 0;
    if (props.isDisabled) tabIndex = undefined;
    return {
        focusableProps: (0, $89b39774f3b79dbb$exports.mergeProps)({
            ...interactions,
            tabIndex: tabIndex
        }, interactionProps)
    };
}
const $cfe896014413cb8c$export$35a3bebf7ef2d934 = /*#__PURE__*/ (0, $36KMZ$react.forwardRef)(({ children: children, ...props }, ref)=>{
    ref = (0, $d3019c77b88650e9$exports.useObjectRef)(ref);
    let { focusableProps: focusableProps } = $cfe896014413cb8c$export$4c014de7c8940b4c(props, ref);
    let child = (0, ($parcel$interopDefault($36KMZ$react))).Children.only(children);
    (0, $36KMZ$react.useEffect)(()=>{
        if (process.env.NODE_ENV === 'production') return;
        let el = ref.current;
        if (!el || !(el instanceof (0, $49582955cc364b1c$exports.getOwnerWindow)(el).Element)) {
            console.error('<Focusable> child must forward its ref to a DOM element.');
            return;
        }
        if (!props.isDisabled && !(0, $48f566b6becd50da$exports.isFocusable)(el)) {
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
    let childRef = parseInt((0, ($parcel$interopDefault($36KMZ$react))).version, 10) < 19 ? child.ref : child.props.ref;
    return /*#__PURE__*/ (0, ($parcel$interopDefault($36KMZ$react))).cloneElement(child, {
        ...(0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, child.props),
        // @ts-ignore
        ref: (0, $8b3af019b8cf786c$exports.mergeRefs)(childRef, ref)
    });
});


//# sourceMappingURL=useFocusable.cjs.map
