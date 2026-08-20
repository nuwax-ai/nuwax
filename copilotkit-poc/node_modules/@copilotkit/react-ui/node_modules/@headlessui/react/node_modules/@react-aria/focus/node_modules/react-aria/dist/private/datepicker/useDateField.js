import {createFocusManager as $903814aeb7d53b38$export$c5251b9e124bf29} from "../focus/FocusScope.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import $dWWa2$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDatePickerGroup as $69ed6c8aabd1db26$export$4a931266a3838b86} from "./useDatePickerGroup.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useFormValidation as $3bea40a930a50ce5$export$b8473d3665f3a75a} from "../form/useFormValidation.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useRef as $dWWa2$useRef, useMemo as $dWWa2$useMemo, useEffect as $dWWa2$useEffect} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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











const $5e49eec2a9af6334$export$653eddfc964b0f8a = new WeakMap();
const $5e49eec2a9af6334$export$300019f83c56d282 = '__reactAriaDateFieldRole';
const $5e49eec2a9af6334$export$7b3062cd49e80452 = '__reactAriaDateFieldFocusManager';
function $5e49eec2a9af6334$export$5591b0b878c1a989(props, state, ref) {
    var _state_value;
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let valueOnFocus = (0, $dWWa2$useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        ...props,
        onFocusWithin (e) {
            var _props_onFocus;
            valueOnFocus.current = state.value;
            (_props_onFocus = props.onFocus) === null || _props_onFocus === void 0 ? void 0 : _props_onFocus.call(props, e);
        },
        onBlurWithin: (e)=>{
            var _props_onBlur;
            state.confirmPlaceholder();
            if (state.value !== valueOnFocus.current) state.commitValidation();
            (_props_onBlur = props.onBlur) === null || _props_onBlur === void 0 ? void 0 : _props_onBlur.call(props, e);
        },
        onFocusWithinChange: props.onFocusChange
    });
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($dWWa2$intlStringsjs))), '@react-aria/datepicker');
    let message = state.maxGranularity === 'hour' ? 'selectedTimeDescription' : 'selectedDateDescription';
    let field = state.maxGranularity === 'hour' ? 'time' : 'date';
    let description = state.value ? stringFormatter.format(message, {
        [field]: state.formatValue({
            month: 'long'
        })
    }) : '';
    let descProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    // If within a date picker or date range picker, the date field will have role="presentation" and an aria-describedby
    // will be passed in that references the value (e.g. entire range). Otherwise, add the field's value description.
    let describedBy = props[$5e49eec2a9af6334$export$300019f83c56d282] === 'presentation' ? fieldProps['aria-describedby'] : [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let propsFocusManager = props[$5e49eec2a9af6334$export$7b3062cd49e80452];
    let focusManager = (0, $dWWa2$useMemo)(()=>propsFocusManager || (0, $903814aeb7d53b38$export$c5251b9e124bf29)(ref), [
        propsFocusManager,
        ref
    ]);
    let groupProps = (0, $69ed6c8aabd1db26$export$4a931266a3838b86)(state, ref, props[$5e49eec2a9af6334$export$300019f83c56d282] === 'presentation');
    // Pass labels and other information to segments.
    $5e49eec2a9af6334$export$653eddfc964b0f8a.set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: [
            labelProps.id,
            props['aria-labelledby']
        ].filter(Boolean).join(' ') || undefined,
        ariaDescribedBy: describedBy,
        focusManager: focusManager
    });
    let autoFocusRef = (0, $dWWa2$useRef)(props.autoFocus);
    // When used within a date picker or date range picker, the field gets role="presentation"
    // rather than role="group". Since the date picker/date range picker already has a role="group"
    // with a label and description, and the segments are already labeled by this as well, this
    // avoids very verbose duplicate announcements.
    let fieldDOMProps;
    if (props[$5e49eec2a9af6334$export$300019f83c56d282] === 'presentation') fieldDOMProps = {
        role: 'presentation'
    };
    else fieldDOMProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(fieldProps, {
        role: 'group',
        'aria-disabled': props.isDisabled || undefined,
        'aria-describedby': describedBy
    });
    (0, $dWWa2$useEffect)(()=>{
        if (autoFocusRef.current) focusManager.focusFirst();
        autoFocusRef.current = false;
    }, [
        focusManager
    ]);
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(props.inputRef, state.defaultValue, state.setValue);
    (0, $3bea40a930a50ce5$export$b8473d3665f3a75a)({
        ...props,
        focus () {
            focusManager.focusFirst();
        }
    }, state, props.inputRef);
    let inputProps = {
        type: 'hidden',
        name: props.name,
        form: props.form,
        value: ((_state_value = state.value) === null || _state_value === void 0 ? void 0 : _state_value.toString()) || '',
        disabled: props.isDisabled
    };
    if (props.validationBehavior === 'native') {
        // Use a hidden <input type="text"> rather than <input type="hidden">
        // so that an empty value blocks HTML form submission when the field is required.
        inputProps.type = 'text';
        inputProps.hidden = true;
        inputProps.required = props.isRequired;
        // Ignore react warning.
        inputProps.onChange = ()=>{};
    }
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, fieldDOMProps, groupProps, focusWithinProps, {
            onKeyDown (e) {
                if (props.onKeyDown) props.onKeyDown(e);
            },
            onKeyUp (e) {
                if (props.onKeyUp) props.onKeyUp(e);
            },
            style: {
                unicodeBidi: 'isolate'
            }
        }),
        inputProps: inputProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}
function $5e49eec2a9af6334$export$4c842f6a241dc825(props, state, ref) {
    var _state_timeValue;
    let res = $5e49eec2a9af6334$export$5591b0b878c1a989(props, state, ref);
    res.inputProps.value = ((_state_timeValue = state.timeValue) === null || _state_timeValue === void 0 ? void 0 : _state_timeValue.toString()) || '';
    return res;
}


export {$5e49eec2a9af6334$export$653eddfc964b0f8a as hookData, $5e49eec2a9af6334$export$300019f83c56d282 as roleSymbol, $5e49eec2a9af6334$export$7b3062cd49e80452 as focusManagerSymbol, $5e49eec2a9af6334$export$5591b0b878c1a989 as useDateField, $5e49eec2a9af6334$export$4c842f6a241dc825 as useTimeField};
//# sourceMappingURL=useDateField.js.map
