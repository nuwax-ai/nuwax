import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useFormValidation as $3bea40a930a50ce5$export$b8473d3665f3a75a} from "../form/useFormValidation.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useSlotId2 as $901b0394915cd0c2$export$ed2feabec4a533f4} from "../utils/useSlot.js";
import {useState as $2yVP5$useState} from "react";
import {useFormValidationState as $2yVP5$useFormValidationState, privateValidationStateProp as $2yVP5$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";

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









function $02953ddad5f95ac5$export$cbe85ee05b554577(props, state, ref) {
    let { isDisabled: isDisabled = false, isReadOnly: isReadOnly = false, value: value, name: name, form: form, children: children, isRequired: isRequired, validationBehavior: validationBehavior = 'aria', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, 'aria-describedby': ariaDescribedby, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressChange: onPressChange, onPress: onPress, onPressUp: onPressUp, onClick: onClick } = props;
    // Create validation state here because it doesn't make sense to add to general useToggleState.
    let validationState = (0, $2yVP5$useFormValidationState)({
        ...props,
        value: state.isSelected
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = validationState.displayValidation;
    (0, $3bea40a930a50ce5$export$b8473d3665f3a75a)(props, validationState, ref);
    let onChange = (e)=>{
        // since we spread props on label, onChange will end up there as well as in here.
        // so we have to stop propagation at the lowest level that we care about
        e.stopPropagation();
        state.setSelected((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).checked);
    };
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide children, you must specify an aria-label for accessibility');
    // Handle press state for keyboard interactions and cases where labelProps is not used.
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPress: onPress,
        onPressUp: onPressUp,
        onClick: onClick,
        isDisabled: isDisabled
    });
    // Handle press state on the label.
    let [isLabelPressed, setLabelPressed] = (0, $2yVP5$useState)(false);
    let { pressProps: labelProps } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        onPressStart (e) {
            // Keyboard interactions are handled directly on the input.
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressStart === null || onPressStart === void 0 ? void 0 : onPressStart(e);
            onPressChange === null || onPressChange === void 0 ? void 0 : onPressChange(true);
            setLabelPressed(true);
        },
        onPressEnd (e) {
            // Keyboard interactions are handled directly on the input.
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressEnd === null || onPressEnd === void 0 ? void 0 : onPressEnd(e);
            onPressChange === null || onPressChange === void 0 ? void 0 : onPressChange(false);
            setLabelPressed(false);
        },
        onPressUp (e) {
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPressUp === null || onPressUp === void 0 ? void 0 : onPressUp(e);
        },
        onClick: onClick,
        onPress (e) {
            var _ref_current;
            if (e.pointerType === 'keyboard' || e.pointerType === 'virtual') {
                e.continuePropagation();
                return;
            }
            onPress === null || onPress === void 0 ? void 0 : onPress(e);
            state.toggle();
            (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.focus();
            // @ts-expect-error
            let { [(0, $2yVP5$privateValidationStateProp)]: groupValidationState } = props;
            let { commitValidation: commitValidation } = groupValidationState ? groupValidationState : validationState;
            commitValidation();
        },
        isDisabled: isDisabled || isReadOnly
    });
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)(props, ref);
    let interactions = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(pressProps, focusableProps);
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(ref, state.defaultSelected, state.setSelected);
    // Copied from useField because we don't want the label behavior that provides.
    let descriptionProps = (0, $901b0394915cd0c2$export$ed2feabec4a533f4)();
    let errorMessageProps = (0, $901b0394915cd0c2$export$ed2feabec4a533f4)();
    return {
        labelProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(labelProps, {
            onClick: (e)=>e.preventDefault()
        }),
        inputProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
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


export {$02953ddad5f95ac5$export$cbe85ee05b554577 as useToggle};
//# sourceMappingURL=useToggle.js.map
