var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $60b1d3323c1be9a0$exports = require("./useSelect.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $2dfbb9cb434f8768$exports = require("../form/useFormValidation.cjs");
var $3455634180ecf75c$exports = require("../visually-hidden/VisuallyHidden.cjs");
var $jeuL3$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useHiddenSelect", function () { return $1263937900375392$export$f809e80f58e251d1; });
$parcel$export(module.exports, "HiddenSelect", function () { return $1263937900375392$export$cbd84cdb2e668835; });
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





function $1263937900375392$export$f809e80f58e251d1(props, state, triggerRef) {
    let data = (0, $60b1d3323c1be9a0$exports.selectData).get(state) || {};
    let { autoComplete: autoComplete, name: name = data.name, form: form = data.form, isDisabled: isDisabled = data.isDisabled } = props;
    let { validationBehavior: validationBehavior, isRequired: isRequired } = data;
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $3455634180ecf75c$exports.useVisuallyHidden)({
        style: {
            // Prevent page scrolling.
            position: 'fixed',
            top: 0,
            left: 0
        }
    });
    (0, $bbab3903416f8d01$exports.useFormReset)(props.selectRef, state.defaultValue, state.setValue);
    (0, $2dfbb9cb434f8768$exports.useFormValidation)({
        validationBehavior: validationBehavior,
        focus: ()=>triggerRef.current?.focus()
    }, state, props.selectRef);
    let setValue = state.setValue;
    let onChange = (0, $jeuL3$react.useCallback)((e)=>{
        let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
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
function $1263937900375392$export$cbd84cdb2e668835(props) {
    let { state: state, triggerRef: triggerRef, label: label, name: name, form: form, isDisabled: isDisabled } = props;
    let selectRef = (0, $jeuL3$react.useRef)(null);
    let inputRef = (0, $jeuL3$react.useRef)(null);
    let { containerProps: containerProps, selectProps: selectProps } = $1263937900375392$export$f809e80f58e251d1({
        ...props,
        selectRef: state.collection.size <= 300 ? selectRef : inputRef
    }, state, triggerRef);
    let values = Array.isArray(state.value) ? state.value : [
        state.value
    ];
    // If used in a <form>, use a hidden input so the value can be submitted to a server.
    // If the collection isn't too big, use a hidden <select> element for this so that browser
    // autofill will work. Otherwise, use an <input type="hidden">.
    if (state.collection.size <= 300) return /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("div", {
        ...containerProps,
        "data-testid": "hidden-select-container"
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("label", null, label, /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("select", {
        ...selectProps,
        ref: selectRef
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("option", {
        value: "",
        label: '\u00A0'
    }, '\u00A0'), [
        ...state.collection.getKeys()
    ].map((key)=>{
        let item = state.collection.getItem(key);
        if (item && item.type === 'item') return /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("option", {
            key: item.key,
            value: item.key
        }, item.textValue);
    }), state.collection.size === 0 && name && values.map((value, i)=>/*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("option", {
            key: i,
            value: value ?? ''
        })))));
    else if (name) {
        let data = (0, $60b1d3323c1be9a0$exports.selectData).get(state) || {};
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
            return /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("input", {
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
            return /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement("input", {
                key: i,
                ...inputProps,
                ref: i === 0 ? inputRef : null
            });
        });
        return /*#__PURE__*/ (0, ($parcel$interopDefault($jeuL3$react))).createElement((0, ($parcel$interopDefault($jeuL3$react))).Fragment, null, res);
    }
    return null;
}


//# sourceMappingURL=HiddenSelect.cjs.map
