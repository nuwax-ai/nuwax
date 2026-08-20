var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $45851fded752e83c$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $593fdd0ed62674c2$exports = require("./useDatePickerGroup.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $e3486d9c44549186$exports = require("../label/useField.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $2dfbb9cb434f8768$exports = require("../form/useFormValidation.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $gUEQj$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "hookData", function () { return $f6a0574fa98a3f25$export$653eddfc964b0f8a; });
$parcel$export(module.exports, "roleSymbol", function () { return $f6a0574fa98a3f25$export$300019f83c56d282; });
$parcel$export(module.exports, "focusManagerSymbol", function () { return $f6a0574fa98a3f25$export$7b3062cd49e80452; });
$parcel$export(module.exports, "useDateField", function () { return $f6a0574fa98a3f25$export$5591b0b878c1a989; });
$parcel$export(module.exports, "useTimeField", function () { return $f6a0574fa98a3f25$export$4c842f6a241dc825; });
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











const $f6a0574fa98a3f25$export$653eddfc964b0f8a = new WeakMap();
const $f6a0574fa98a3f25$export$300019f83c56d282 = '__reactAriaDateFieldRole';
const $f6a0574fa98a3f25$export$7b3062cd49e80452 = '__reactAriaDateFieldFocusManager';
function $f6a0574fa98a3f25$export$5591b0b878c1a989(props, state, ref) {
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $e3486d9c44549186$exports.useField)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let valueOnFocus = (0, $gUEQj$react.useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
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
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($45851fded752e83c$exports))), '@react-aria/datepicker');
    let message = state.maxGranularity === 'hour' ? 'selectedTimeDescription' : 'selectedDateDescription';
    let field = state.maxGranularity === 'hour' ? 'time' : 'date';
    let description = state.value ? stringFormatter.format(message, {
        [field]: state.formatValue({
            month: 'long'
        })
    }) : '';
    let descProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(description);
    // If within a date picker or date range picker, the date field will have role="presentation" and an aria-describedby
    // will be passed in that references the value (e.g. entire range). Otherwise, add the field's value description.
    let describedBy = props[$f6a0574fa98a3f25$export$300019f83c56d282] === 'presentation' ? fieldProps['aria-describedby'] : [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let propsFocusManager = props[$f6a0574fa98a3f25$export$7b3062cd49e80452];
    let focusManager = (0, $gUEQj$react.useMemo)(()=>propsFocusManager || (0, $9fb4ac1cc58342cc$exports.createFocusManager)(ref), [
        propsFocusManager,
        ref
    ]);
    let groupProps = (0, $593fdd0ed62674c2$exports.useDatePickerGroup)(state, ref, props[$f6a0574fa98a3f25$export$300019f83c56d282] === 'presentation');
    // Pass labels and other information to segments.
    $f6a0574fa98a3f25$export$653eddfc964b0f8a.set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: [
            labelProps.id,
            props['aria-labelledby']
        ].filter(Boolean).join(' ') || undefined,
        ariaDescribedBy: describedBy,
        focusManager: focusManager
    });
    let autoFocusRef = (0, $gUEQj$react.useRef)(props.autoFocus);
    // When used within a date picker or date range picker, the field gets role="presentation"
    // rather than role="group". Since the date picker/date range picker already has a role="group"
    // with a label and description, and the segments are already labeled by this as well, this
    // avoids very verbose duplicate announcements.
    let fieldDOMProps;
    if (props[$f6a0574fa98a3f25$export$300019f83c56d282] === 'presentation') fieldDOMProps = {
        role: 'presentation'
    };
    else fieldDOMProps = (0, $89b39774f3b79dbb$exports.mergeProps)(fieldProps, {
        role: 'group',
        'aria-disabled': props.isDisabled || undefined,
        'aria-describedby': describedBy
    });
    (0, $gUEQj$react.useEffect)(()=>{
        if (autoFocusRef.current) focusManager.focusFirst();
        autoFocusRef.current = false;
    }, [
        focusManager
    ]);
    (0, $bbab3903416f8d01$exports.useFormReset)(props.inputRef, state.defaultValue, state.setValue);
    (0, $2dfbb9cb434f8768$exports.useFormValidation)({
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
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props);
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, fieldDOMProps, groupProps, focusWithinProps, {
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
function $f6a0574fa98a3f25$export$4c842f6a241dc825(props, state, ref) {
    let res = $f6a0574fa98a3f25$export$5591b0b878c1a989(props, state, ref);
    res.inputProps.value = state.timeValue?.toString() || '';
    return res;
}


//# sourceMappingURL=useDateField.cjs.map
