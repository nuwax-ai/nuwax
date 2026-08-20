import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useFormValidation as $3bea40a930a50ce5$export$b8473d3665f3a75a} from "../form/useFormValidation.js";
import $kzr8H$react, {useState as $kzr8H$useState} from "react";
import {useControlledState as $kzr8H$useControlledState} from "react-stately/useControlledState";
import {useFormValidationState as $kzr8H$useFormValidationState} from "react-stately/private/form/useFormValidationState";

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









function $032ede929f47bd98$export$712718f7aec83d5(props, ref) {
    let { inputElementType: inputElementType = 'input', isDisabled: isDisabled = false, isRequired: isRequired = false, isReadOnly: isReadOnly = false, type: type = 'text', validationBehavior: validationBehavior = 'aria' } = props;
    let [value, setValue] = (0, $kzr8H$useControlledState)(props.value, props.defaultValue || '', props.onChange);
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)(props, ref);
    let validationState = (0, $kzr8H$useFormValidationState)({
        ...props,
        value: value
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = validationState.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    const inputOnlyProps = {
        type: type,
        pattern: props.pattern
    };
    let [initialValue] = (0, $kzr8H$useState)(value);
    var _props_defaultValue;
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(ref, (_props_defaultValue = props.defaultValue) !== null && _props_defaultValue !== void 0 ? _props_defaultValue : initialValue, setValue);
    (0, $3bea40a930a50ce5$export$b8473d3665f3a75a)(props, validationState, ref);
    return {
        labelProps: labelProps,
        inputProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, inputElementType === 'input' ? inputOnlyProps : undefined, {
            disabled: isDisabled,
            readOnly: isReadOnly,
            required: isRequired && validationBehavior === 'native',
            'aria-required': isRequired && validationBehavior === 'aria' || undefined,
            'aria-invalid': isInvalid || undefined,
            'aria-errormessage': props['aria-errormessage'],
            'aria-activedescendant': props['aria-activedescendant'],
            'aria-autocomplete': props['aria-autocomplete'],
            'aria-haspopup': props['aria-haspopup'],
            'aria-controls': props['aria-controls'],
            value: value,
            onChange: (e)=>setValue((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).value),
            autoComplete: props.autoComplete,
            autoCapitalize: props.autoCapitalize,
            maxLength: props.maxLength,
            minLength: props.minLength,
            name: props.name,
            form: props.form,
            placeholder: props.placeholder,
            inputMode: props.inputMode,
            autoCorrect: props.autoCorrect,
            spellCheck: props.spellCheck,
            [parseInt((0, $kzr8H$react).version, 10) >= 17 ? 'enterKeyHint' : 'enterkeyhint']: props.enterKeyHint,
            // Clipboard events
            onCopy: props.onCopy,
            onCut: props.onCut,
            onPaste: props.onPaste,
            // Composition events
            onCompositionEnd: props.onCompositionEnd,
            onCompositionStart: props.onCompositionStart,
            onCompositionUpdate: props.onCompositionUpdate,
            // Selection events
            onSelect: props.onSelect,
            // Input events
            onBeforeInput: props.onBeforeInput,
            onInput: props.onInput,
            ...focusableProps,
            ...fieldProps
        }),
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


export {$032ede929f47bd98$export$712718f7aec83d5 as useTextField};
//# sourceMappingURL=useTextField.js.map
