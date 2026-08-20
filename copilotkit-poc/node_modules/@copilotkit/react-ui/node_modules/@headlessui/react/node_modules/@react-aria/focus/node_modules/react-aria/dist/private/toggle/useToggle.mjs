import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useFormValidation as $860f7da480e22816$export$b8473d3665f3a75a} from "../form/useFormValidation.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";
import {useSlotId2 as $4c14b02d5228be26$export$ed2feabec4a533f4} from "../utils/useSlot.mjs";
import {useState as $jQnU8$useState} from "react";
import {useFormValidationState as $jQnU8$useFormValidationState, privateValidationStateProp as $jQnU8$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";

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









function $876b6f32ca5a04c3$export$cbe85ee05b554577(props, state, ref) {
    let { isDisabled: isDisabled = false, isReadOnly: isReadOnly = false, value: value, name: name, form: form, children: children, isRequired: isRequired, validationBehavior: validationBehavior = 'aria', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressChange: onPressChange, onPress: onPress, onPressUp: onPressUp, onClick: onClick } = props;
    // Create validation state here because it doesn't make sense to add to general useToggleState.
    let validationState = (0, $jQnU8$useFormValidationState)({
        ...props,
        value: state.isSelected
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = validationState.displayValidation;
    (0, $860f7da480e22816$export$b8473d3665f3a75a)(props, validationState, ref);
    let onChange = (e)=>{
        // since we spread props on label, onChange will end up there as well as in here.
        // so we have to stop propagation at the lowest level that we care about
        e.stopPropagation();
        state.setSelected((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e).checked);
    };
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide children, you must specify an aria-label for accessibility');
    // Handle press state for keyboard interactions and cases where labelProps is not used.
    let { pressProps: pressProps, isPressed: isPressed } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPress: onPress,
        onPressUp: onPressUp,
        onClick: onClick,
        isDisabled: isDisabled
    });
    // Handle press state on the label.
    let [isLabelPressed, setLabelPressed] = (0, $jQnU8$useState)(false);
    let { pressProps: labelProps } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
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
            let { [(0, $jQnU8$privateValidationStateProp)]: groupValidationState } = props;
            let { commitValidation: commitValidation } = groupValidationState ? groupValidationState : validationState;
            commitValidation();
        },
        isDisabled: isDisabled || isReadOnly
    });
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)(props, ref);
    let interactions = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(pressProps, focusableProps);
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    (0, $3274bf1495747a7b$export$5add1d006293d136)(ref, state.defaultSelected, state.setSelected);
    // Copied from useField because we don't want the label behavior that provides.
    let descriptionProps = (0, $4c14b02d5228be26$export$ed2feabec4a533f4)();
    let errorMessageProps = (0, $4c14b02d5228be26$export$ed2feabec4a533f4)();
    return {
        labelProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(labelProps, {
            onClick: (e)=>e.preventDefault()
        }),
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, {
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


export {$876b6f32ca5a04c3$export$cbe85ee05b554577 as useToggle};
//# sourceMappingURL=useToggle.mjs.map
