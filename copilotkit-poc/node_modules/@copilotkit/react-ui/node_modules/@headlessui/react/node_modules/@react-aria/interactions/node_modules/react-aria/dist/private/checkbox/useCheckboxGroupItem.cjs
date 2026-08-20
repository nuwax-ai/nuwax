var $92a2bffa21a60742$exports = require("./useCheckbox.cjs");
var $40cdbc5fed762ed1$exports = require("./utils.cjs");
var $40lB1$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");
var $40lB1$react = require("react");
var $40lB1$reactstatelyuseToggleState = require("react-stately/useToggleState");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCheckboxGroupItem", function () { return $dcdb96ca10b7e17f$export$353b32fc6898d37d; });
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




function $dcdb96ca10b7e17f$export$353b32fc6898d37d(props, state, inputRef) {
    const toggleState = (0, $40lB1$reactstatelyuseToggleState.useToggleState)({
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isSelected: state.isSelected(props.value),
        defaultSelected: state.defaultValue.includes(props.value),
        onChange (isSelected) {
            if (isSelected) state.addValue(props.value);
            else state.removeValue(props.value);
            if (props.onChange) props.onChange(isSelected);
        }
    });
    let { name: name, form: form, descriptionId: descriptionId, errorMessageId: errorMessageId, validationBehavior: validationBehavior } = (0, $40cdbc5fed762ed1$exports.checkboxGroupData).get(state);
    validationBehavior = props.validationBehavior ?? validationBehavior;
    // Local validation for this checkbox.
    let { realtimeValidation: realtimeValidation } = (0, $40lB1$reactstatelyprivateformuseFormValidationState.useFormValidationState)({
        ...props,
        value: toggleState.isSelected,
        // Server validation is handled at the group level.
        name: undefined,
        validationBehavior: 'aria'
    });
    // Update the checkbox group state when realtime validation changes.
    let nativeValidation = (0, $40lB1$react.useRef)((0, $40lB1$reactstatelyprivateformuseFormValidationState.DEFAULT_VALIDATION_RESULT));
    let updateValidation = ()=>{
        state.setInvalid(props.value, realtimeValidation.isInvalid ? realtimeValidation : nativeValidation.current);
    };
    (0, $40lB1$react.useEffect)(updateValidation);
    // Combine group and checkbox level validation.
    let combinedRealtimeValidation = state.realtimeValidation.isInvalid ? state.realtimeValidation : realtimeValidation;
    let displayValidation = validationBehavior === 'native' ? state.displayValidation : combinedRealtimeValidation;
    let res = (0, $92a2bffa21a60742$exports.useCheckbox)({
        ...props,
        isReadOnly: props.isReadOnly || state.isReadOnly,
        isDisabled: props.isDisabled || state.isDisabled,
        name: props.name || name,
        form: props.form || form,
        isRequired: props.isRequired ?? state.isRequired,
        validationBehavior: validationBehavior,
        [(0, $40lB1$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: {
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


//# sourceMappingURL=useCheckboxGroupItem.cjs.map
