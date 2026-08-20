var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $feff03d1687e9827$exports = require("./utils.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $2dfbb9cb434f8768$exports = require("../form/useFormValidation.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $cfa57f9ca3ae5fa9$exports = require("../utils/useSlot.cjs");
var $KNh8r$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useRadio", function () { return $e30b855ff9ecbfc6$export$37b0961d2f4751e2; });
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








function $e30b855ff9ecbfc6$export$37b0961d2f4751e2(props, state, ref) {
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
    let { pressProps: labelProps, isPressed: isLabelPressed } = (0, $1d003dcb6308cd89$exports.usePress)({
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
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)((0, $89b39774f3b79dbb$exports.mergeProps)(props, {
        onFocus: ()=>state.setLastFocusedValue(value)
    }), ref);
    let interactions = (0, $89b39774f3b79dbb$exports.mergeProps)(pressProps, focusableProps);
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let tabIndex = -1;
    if (state.selectedValue != null) {
        if (state.selectedValue === value) tabIndex = 0;
    } else if (state.lastFocusedValue === value || state.lastFocusedValue == null) tabIndex = 0;
    if (isDisabled) tabIndex = undefined;
    let { name: name, form: form, descriptionId: descriptionId, errorMessageId: errorMessageId, validationBehavior: validationBehavior } = (0, $feff03d1687e9827$exports.radioGroupData).get(state);
    (0, $bbab3903416f8d01$exports.useFormReset)(ref, state.defaultSelectedValue, state.setSelectedValue);
    (0, $2dfbb9cb434f8768$exports.useFormValidation)({
        validationBehavior: validationBehavior
    }, state, ref);
    let descriptionProps = (0, $cfa57f9ca3ae5fa9$exports.useSlotId2)();
    return {
        labelProps: (0, $89b39774f3b79dbb$exports.mergeProps)(labelProps, (0, $KNh8r$react.useMemo)(()=>({
                onClick: (e)=>e.preventDefault(),
                // Prevent label from being focused when mouse down on it.
                // Note, this does not prevent the input from being focused in the `click` event.
                onMouseDown: (e)=>e.preventDefault()
            }), [])),
        inputProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
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


//# sourceMappingURL=useRadio.cjs.map
