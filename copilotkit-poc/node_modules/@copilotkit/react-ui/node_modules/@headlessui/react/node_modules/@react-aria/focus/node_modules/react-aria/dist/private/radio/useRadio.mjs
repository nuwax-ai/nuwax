import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {radioGroupData as $640b6b92b30fd41a$export$37b65e5b5444d35c} from "./utils.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useFormValidation as $860f7da480e22816$export$b8473d3665f3a75a} from "../form/useFormValidation.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";
import {useSlotId2 as $4c14b02d5228be26$export$ed2feabec4a533f4} from "../utils/useSlot.mjs";
import {useMemo as $jgf8P$useMemo} from "react";

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








function $405627c100c5b965$export$37b0961d2f4751e2(props, state, ref) {
    let { value: value, children: children, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, onPressStart: onPressStart, onPressEnd: onPressEnd, onPressChange: onPressChange, onPress: onPress, onPressUp: onPressUp, onClick: onClick } = props;
    const isDisabled = props.isDisabled || state.isDisabled;
    let hasChildren = children != null;
    let hasAriaLabel = ariaLabel != null || ariaLabelledby != null;
    if (!hasChildren && !hasAriaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide children, you must specify an aria-label for accessibility');
    let checked = state.selectedValue === value;
    let onChange = (e)=>{
        e.stopPropagation();
        state.setSelectedValue(value);
    };
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
    let { pressProps: labelProps, isPressed: isLabelPressed } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
        onPressStart: onPressStart,
        onPressEnd: onPressEnd,
        onPressChange: onPressChange,
        onPressUp: onPressUp,
        onClick: onClick,
        isDisabled: isDisabled,
        onPress (e) {
            onPress?.(e);
            state.setSelectedValue(value);
            ref.current?.focus();
        }
    });
    let { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)((0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(props, {
        onFocus: ()=>state.setLastFocusedValue(value)
    }), ref);
    let interactions = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(pressProps, focusableProps);
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let tabIndex = -1;
    if (state.selectedValue != null) {
        if (state.selectedValue === value) tabIndex = 0;
    } else if (state.lastFocusedValue === value || state.lastFocusedValue == null) tabIndex = 0;
    if (isDisabled) tabIndex = undefined;
    let { name: name, form: form, descriptionId: descriptionId, errorMessageId: errorMessageId, validationBehavior: validationBehavior } = (0, $640b6b92b30fd41a$export$37b65e5b5444d35c).get(state);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(ref, state.defaultSelectedValue, state.setSelectedValue);
    (0, $860f7da480e22816$export$b8473d3665f3a75a)({
        validationBehavior: validationBehavior
    }, state, ref);
    let descriptionProps = (0, $4c14b02d5228be26$export$ed2feabec4a533f4)();
    return {
        labelProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(labelProps, (0, $jgf8P$useMemo)(()=>({
                onClick: (e)=>e.preventDefault(),
                // Prevent label from being focused when mouse down on it.
                // Note, this does not prevent the input from being focused in the `click` event.
                onMouseDown: (e)=>e.preventDefault()
            }), [])),
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, {
            ...interactions,
            type: 'radio',
            name: name,
            form: form,
            tabIndex: tabIndex,
            disabled: isDisabled,
            required: state.isRequired && validationBehavior === 'native',
            checked: checked,
            value: value,
            onChange: onChange,
            'aria-describedby': [
                props['aria-describedby'],
                descriptionProps.id,
                state.isInvalid ? errorMessageId : null,
                descriptionId
            ].filter(Boolean).join(' ') || undefined
        }),
        descriptionProps: descriptionProps,
        isDisabled: isDisabled,
        isSelected: checked,
        isPressed: isPressed || isLabelPressed
    };
}


export {$405627c100c5b965$export$37b0961d2f4751e2 as useRadio};
//# sourceMappingURL=useRadio.mjs.map
