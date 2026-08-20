var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $2dfbb9cb434f8768$exports = require("../form/useFormValidation.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $cfa57f9ca3ae5fa9$exports = require("../utils/useSlot.cjs");
var $72SEL$react = require("react");
var $72SEL$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToggle", function () { return $da48c5f79caabf8f$export$cbe85ee05b554577; });
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









function $da48c5f79caabf8f$export$cbe85ee05b554577(props, state, ref) {
    let { isDisabled: isDisabled = false, isReadOnly: isReadOnly = false, value: value, name: name, form: form, children: children, isRequired: isRequired, validationBehavior: validationBehavior = 'aria', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressChange: onPressChange, onPress: onPress, onPressUp: onPressUp, onClick: onClick } = props;
    // Create validation state here because it doesn't make sense to add to general useToggleState.
    let validationState = (0, $72SEL$reactstatelyprivateformuseFormValidationState.useFormValidationState)({
        ...props,
        value: state.isSelected
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = validationState.displayValidation;
    (0, $2dfbb9cb434f8768$exports.useFormValidation)(props, validationState, ref);
    let onChange = (e)=>{
        // since we spread props on label, onChange will end up there as well as in here.
        // so we have to stop propagation at the lowest level that we care about
        e.stopPropagation();
        state.setSelected((0, $da02ee888921bc9e$exports.getEventTarget)(e).checked);
    };
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide children, you must specify an aria-label for accessibility');
    // Handle press state for keyboard interactions and cases where labelProps is not used.
    let { pressProps: pressProps, isPressed: isPressed } = (0, $1d003dcb6308cd89$exports.usePress)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPress: onPress,
        onPressUp: onPressUp,
        onClick: onClick,
        isDisabled: isDisabled
    });
    // Handle press state on the label.
    let [isLabelPressed, setLabelPressed] = (0, $72SEL$react.useState)(false);
    let { pressProps: labelProps } = (0, $1d003dcb6308cd89$exports.usePress)({
        onPressStart (e) {
            // Keyboard interactions are handled directly on the input.
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressStart?.(e);
            onPressChange?.(true);
            setLabelPressed(true);
        },
        onPressEnd (e) {
            // Keyboard interactions are handled directly on the input.
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressEnd?.(e);
            onPressChange?.(false);
            setLabelPressed(false);
        },
        onPressUp (e) {
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressUp?.(e);
        },
        onClick: onClick,
        onPress (e) {
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPress?.(e);
            state.toggle();
            ref.current?.focus();
            // @ts-expect-error
            let { [(0, $72SEL$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: groupValidationState } = props;
            let { commitValidation: commitValidation } = groupValidationState ? groupValidationState : validationState;
            commitValidation();
        },
        isDisabled: isDisabled || isReadOnly
    });
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)(props, ref);
    let interactions = (0, $89b39774f3b79dbb$exports.mergeProps)(pressProps, focusableProps);
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    (0, $bbab3903416f8d01$exports.useFormReset)(ref, state.defaultSelected, state.setSelected);
    // Copied from useField because we don't want the label behavior that provides.
    let descriptionProps = (0, $cfa57f9ca3ae5fa9$exports.useSlotId2)();
    let errorMessageProps = (0, $cfa57f9ca3ae5fa9$exports.useSlotId2)();
    return {
        labelProps: (0, $89b39774f3b79dbb$exports.mergeProps)(labelProps, {
            onClick: (e)=>e.preventDefault()
        }),
        inputProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
            checked: state.isSelected,
            'aria-required': isRequired && validationBehavior === 'aria' || undefined,
            required: isRequired && validationBehavior === 'native',
            'aria-invalid': isInvalid || props.validationState === 'invalid' || undefined,
            'aria-errormessage': props['aria-errormessage'],
            'aria-controls': props['aria-controls'],
            'aria-readonly': isReadOnly || undefined,
            'aria-describedby': [
                descriptionProps.id,
                errorMessageProps.id,
                ariaDescribedby
            ].filter(Boolean).join(' ') || undefined,
            onChange: onChange,
            disabled: isDisabled,
            ...value == null ? {} : {
                value: value
            },
            name: name,
            form: form,
            type: 'checkbox',
            ...interactions
        }),
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isSelected: state.isSelected,
        isPressed: isPressed || isLabelPressed,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isInvalid: isInvalid || props.validationState === 'invalid',
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


//# sourceMappingURL=useToggle.cjs.map
