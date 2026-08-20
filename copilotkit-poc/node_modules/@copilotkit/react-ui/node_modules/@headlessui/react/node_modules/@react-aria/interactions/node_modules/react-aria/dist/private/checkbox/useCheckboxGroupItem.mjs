import {useCheckbox as $dde212bea465bd23$export$e375f10ce42261c5} from "./useCheckbox.mjs";
import {checkboxGroupData as $0fffd24394d22962$export$ec98120685d4f57d} from "./utils.mjs";
import {useFormValidationState as $43eCz$useFormValidationState, DEFAULT_VALIDATION_RESULT as $43eCz$DEFAULT_VALIDATION_RESULT, privateValidationStateProp as $43eCz$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";
import {useRef as $43eCz$useRef, useEffect as $43eCz$useEffect} from "react";
import {useToggleState as $43eCz$useToggleState} from "react-stately/useToggleState";

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




function $55cfc34eef47e1ca$export$353b32fc6898d37d(props, state, inputRef) {
    const toggleState = (0, $43eCz$useToggleState)({
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isSelected: state.isSelected(props.value),
        defaultSelected: state.defaultValue.includes(props.value),
        onChange (isSelected) {
            if (isSelected) state.addValue(props.value);
            else state.removeValue(props.value);
            if (props.onChange) props.onChange(isSelected);
        }
    });
    let { name: name, form: form, descriptionId: descriptionId, errorMessageId: errorMessageId, validationBehavior: validationBehavior } = (0, $0fffd24394d22962$export$ec98120685d4f57d).get(state);
    validationBehavior = props.validationBehavior ?? validationBehavior;
    // Local validation for this checkbox.
    let { realtimeValidation: realtimeValidation } = (0, $43eCz$useFormValidationState)({
        ...props,
        value: toggleState.isSelected,
        // Server validation is handled at the group level.
        name: undefined,
        validationBehavior: 'aria'
    });
    // Update the checkbox group state when realtime validation changes.
    let nativeValidation = (0, $43eCz$useRef)((0, $43eCz$DEFAULT_VALIDATION_RESULT));
    let updateValidation = ()=>{
        state.setInvalid(props.value, realtimeValidation.isInvalid ? realtimeValidation : nativeValidation.current);
    };
    (0, $43eCz$useEffect)(updateValidation);
    // Combine group and checkbox level validation.
    let combinedRealtimeValidation = state.realtimeValidation.isInvalid ? state.realtimeValidation : realtimeValidation;
    let displayValidation = validationBehavior === 'native' ? state.displayValidation : combinedRealtimeValidation;
    let res = (0, $dde212bea465bd23$export$e375f10ce42261c5)({
        ...props,
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isDisabled: props.isDisabled || state.isDisabled,
        name: props.name || name,
        form: props.form || form,
        isRequired: props.isRequired ?? state.isRequired,
        validationBehavior: validationBehavior,
        [(0, $43eCz$privateValidationStateProp)]: {
            realtimeValidation: combinedRealtimeValidation,
            displayValidation: displayValidation,
            resetValidation: state.resetValidation,
            commitValidation: state.commitValidation,
            updateValidation (v) {
                nativeValidation.current = v;
                updateValidation();
            }
        }
    }, toggleState, inputRef);
    return {
        ...res,
        inputProps: {
            ...res.inputProps,
            'aria-describedby': [
                res.inputProps['aria-describedby'],
                state.isInvalid ? errorMessageId : null,
                descriptionId
            ].filter(Boolean).join(' ') || undefined
        }
    };
}


export {$55cfc34eef47e1ca$export$353b32fc6898d37d as useCheckboxGroupItem};
//# sourceMappingURL=useCheckboxGroupItem.mjs.map
