import {createFocusManager as $535772f9d2c1f38d$export$c5251b9e124bf29} from "../focus/FocusScope.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $GVr02$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDatePickerGroup as $6a440d0e2d99dd46$export$4a931266a3838b86} from "./useDatePickerGroup.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useField as $191c9b6d48a0a4e2$export$294aa081a6c6f55d} from "../label/useField.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useFormValidation as $860f7da480e22816$export$b8473d3665f3a75a} from "../form/useFormValidation.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useRef as $GVr02$useRef, useMemo as $GVr02$useMemo, useEffect as $GVr02$useEffect} from "react";


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











const $7541913c0284d84b$export$653eddfc964b0f8a = new WeakMap();
const $7541913c0284d84b$export$300019f83c56d282 = '__reactAriaDateFieldRole';
const $7541913c0284d84b$export$7b3062cd49e80452 = '__reactAriaDateFieldFocusManager';
function $7541913c0284d84b$export$5591b0b878c1a989(props, state, ref) {
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $191c9b6d48a0a4e2$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let valueOnFocus = (0, $GVr02$useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        ...props,
        onFocusWithin (e) {
            valueOnFocus.current = state.value;
            props.onFocus?.(e);
        },
        onBlurWithin: (e)=>{
            state.confirmPlaceholder();
            if (state.value !== valueOnFocus.current) state.commitValidation();
            props.onBlur?.(e);
        },
        onFocusWithinChange: props.onFocusChange
    });
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($GVr02$intlStringsmjs))), '@react-aria/datepicker');
    let message = state.maxGranularity === 'hour' ? 'selectedTimeDescription' : 'selectedDateDescription';
    let field = state.maxGranularity === 'hour' ? 'time' : 'date';
    let description = state.value ? stringFormatter.format(message, {
        [field]: state.formatValue({
            month: 'long'
        })
    }) : '';
    let descProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(description);
    // If within a date picker or date range picker, the date field will have role="presentation" and an aria-describedby
    // will be passed in that references the value (e.g. entire range). Otherwise, add the field's value description.
    let describedBy = props[$7541913c0284d84b$export$300019f83c56d282] === 'presentation' ? fieldProps['aria-describedby'] : [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let propsFocusManager = props[$7541913c0284d84b$export$7b3062cd49e80452];
    let focusManager = (0, $GVr02$useMemo)(()=>propsFocusManager || (0, $535772f9d2c1f38d$export$c5251b9e124bf29)(ref), [
        propsFocusManager,
        ref
    ]);
    let groupProps = (0, $6a440d0e2d99dd46$export$4a931266a3838b86)(state, ref, props[$7541913c0284d84b$export$300019f83c56d282] === 'presentation');
    // Pass labels and other information to segments.
    $7541913c0284d84b$export$653eddfc964b0f8a.set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: [
            labelProps.id,
            props['aria-labelledby']
        ].filter(Boolean).join(' ') || undefined,
        ariaDescribedBy: describedBy,
        focusManager: focusManager
    });
    let autoFocusRef = (0, $GVr02$useRef)(props.autoFocus);
    // When used within a date picker or date range picker, the field gets role="presentation"
    // rather than role="group". Since the date picker/date range picker already has a role="group"
    // with a label and description, and the segments are already labeled by this as well, this
    // avoids very verbose duplicate announcements.
    let fieldDOMProps;
    if (props[$7541913c0284d84b$export$300019f83c56d282] === 'presentation') fieldDOMProps = {
        role: 'presentation'
    };
    else fieldDOMProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(fieldProps, {
        role: 'group',
        'aria-disabled': props.isDisabled || undefined,
        'aria-describedby': describedBy
    });
    (0, $GVr02$useEffect)(()=>{
        if (autoFocusRef.current) focusManager.focusFirst();
        autoFocusRef.current = false;
    }, [
        focusManager
    ]);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(props.inputRef, state.defaultValue, state.setValue);
    (0, $860f7da480e22816$export$b8473d3665f3a75a)({
        ...props,
        focus () {
            focusManager.focusFirst();
        }
    }, state, props.inputRef);
    let inputProps = {
        type: 'hidden',
        name: props.name,
        form: props.form,
        value: state.value?.toString() || '',
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
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props);
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, fieldDOMProps, groupProps, focusWithinProps, {
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
function $7541913c0284d84b$export$4c842f6a241dc825(props, state, ref) {
    let res = $7541913c0284d84b$export$5591b0b878c1a989(props, state, ref);
    res.inputProps.value = state.timeValue?.toString() || '';
    return res;
}


export {$7541913c0284d84b$export$653eddfc964b0f8a as hookData, $7541913c0284d84b$export$300019f83c56d282 as roleSymbol, $7541913c0284d84b$export$7b3062cd49e80452 as focusManagerSymbol, $7541913c0284d84b$export$5591b0b878c1a989 as useDateField, $7541913c0284d84b$export$4c842f6a241dc825 as useTimeField};
//# sourceMappingURL=useDateField.mjs.map
