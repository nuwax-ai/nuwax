import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {selectData as $c0a45cd074520508$export$703601b7e90536f8} from "./useSelect.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useFormValidation as $860f7da480e22816$export$b8473d3665f3a75a} from "../form/useFormValidation.mjs";
import {useVisuallyHidden as $ea3928288112382f$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.mjs";
import $8AqU6$react, {useCallback as $8AqU6$useCallback, useRef as $8AqU6$useRef} from "react";

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





function $b046d185a4525d56$export$f809e80f58e251d1(props, state, triggerRef) {
    let data = (0, $c0a45cd074520508$export$703601b7e90536f8).get(state) || {};
    let { autoComplete: autoComplete, name: name = data.name, form: form = data.form, isDisabled: isDisabled = data.isDisabled } = props;
    let { validationBehavior: validationBehavior, isRequired: isRequired } = data;
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $ea3928288112382f$export$a966af930f325cab)({
        style: {
            // Prevent page scrolling.
            position: 'fixed',
            top: 0,
            left: 0
        }
    });
    (0, $3274bf1495747a7b$export$5add1d006293d136)(props.selectRef, state.defaultValue, state.setValue);
    (0, $860f7da480e22816$export$b8473d3665f3a75a)({
        validationBehavior: validationBehavior,
        focus: ()=>triggerRef.current?.focus()
    }, state, props.selectRef);
    let setValue = state.setValue;
    let onChange = (0, $8AqU6$useCallback)((e)=>{
        let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        if (eventTarget.multiple) setValue(Array.from(eventTarget.selectedOptions, (option)=>option.value));
        else setValue(e.currentTarget.value);
    }, [
        setValue
    ]);
    // In Safari, the <select> cannot have `display: none` or `hidden` for autofill to work.
    // In Firefox, there must be a <label> to identify the <select> whereas other browsers
    // seem to identify it just by surrounding text.
    // The solution is to use <VisuallyHidden> to hide the elements, which clips the elements to a
    // 1px rectangle. In addition, we hide from screen readers with aria-hidden, and make the <select>
    // non tabbable with tabIndex={-1}.
    return {
        containerProps: {
            ...visuallyHiddenProps,
            'aria-hidden': true,
            // @ts-ignore
            ['data-react-aria-prevent-focus']: true,
            // @ts-ignore
            ['data-a11y-ignore']: 'aria-hidden-focus'
        },
        inputProps: {
            style: {
                display: 'none'
            }
        },
        selectProps: {
            tabIndex: -1,
            autoComplete: autoComplete,
            disabled: isDisabled,
            multiple: state.selectionManager.selectionMode === 'multiple',
            required: validationBehavior === 'native' && isRequired,
            name: name,
            form: form,
            value: state.value ?? '',
            onChange: onChange,
            onInput: onChange
        }
    };
}
function $b046d185a4525d56$export$cbd84cdb2e668835(props) {
    let { state: state, triggerRef: triggerRef, label: label, name: name, form: form, isDisabled: isDisabled } = props;
    let selectRef = (0, $8AqU6$useRef)(null);
    let inputRef = (0, $8AqU6$useRef)(null);
    let { containerProps: containerProps, selectProps: selectProps } = $b046d185a4525d56$export$f809e80f58e251d1({
        ...props,
        selectRef: state.collection.size <= 300 ? selectRef : inputRef
    }, state, triggerRef);
    let values = Array.isArray(state.value) ? state.value : [
        state.value
    ];
    // If used in a <form>, use a hidden input so the value can be submitted to a server.
    // If the collection isn't too big, use a hidden <select> element for this so that browser
    // autofill will work. Otherwise, use an <input type="hidden">.
    if (state.collection.size <= 300) return /*#__PURE__*/ (0, $8AqU6$react).createElement("div", {
        ...containerProps,
        "data-testid": "hidden-select-container"
    }, /*#__PURE__*/ (0, $8AqU6$react).createElement("label", null, label, /*#__PURE__*/ (0, $8AqU6$react).createElement("select", {
        ...selectProps,
        ref: selectRef
    }, /*#__PURE__*/ (0, $8AqU6$react).createElement("option", {
        value: "",
        label: '\u00A0'
    }, '\u00A0'), [
        ...state.collection.getKeys()
    ].map((key)=>{
        let item = state.collection.getItem(key);
        if (item && item.type === 'item') return /*#__PURE__*/ (0, $8AqU6$react).createElement("option", {
            key: item.key,
            value: item.key
        }, item.textValue);
    }), state.collection.size === 0 && name && values.map((value, i)=>/*#__PURE__*/ (0, $8AqU6$react).createElement("option", {
            key: i,
            value: value ?? ''
        })))));
    else if (name) {
        let data = (0, $c0a45cd074520508$export$703601b7e90536f8).get(state) || {};
        let { validationBehavior: validationBehavior } = data;
        // Always render at least one hidden input to ensure required form submission.
        if (values.length === 0) values = [
            null
        ];
        let res = values.map((value, i)=>{
            let inputProps = {
                type: 'hidden',
                autoComplete: selectProps.autoComplete,
                name: name,
                form: form,
                disabled: isDisabled,
                value: value ?? ''
            };
            if (validationBehavior === 'native') // Use a hidden <input type="text"> rather than <input type="hidden">
            // so that an empty value blocks HTML form submission when the field is required.
            return /*#__PURE__*/ (0, $8AqU6$react).createElement("input", {
                key: i,
                ...inputProps,
                ref: i === 0 ? inputRef : null,
                style: {
                    display: 'none'
                },
                type: "text",
                required: i === 0 ? selectProps.required : false,
                onChange: ()=>{
                /** Ignore react warning. */ }
            });
            return /*#__PURE__*/ (0, $8AqU6$react).createElement("input", {
                key: i,
                ...inputProps,
                ref: i === 0 ? inputRef : null
            });
        });
        return /*#__PURE__*/ (0, $8AqU6$react).createElement((0, $8AqU6$react).Fragment, null, res);
    }
    return null;
}


export {$b046d185a4525d56$export$f809e80f58e251d1 as useHiddenSelect, $b046d185a4525d56$export$cbd84cdb2e668835 as HiddenSelect};
//# sourceMappingURL=HiddenSelect.mjs.map
