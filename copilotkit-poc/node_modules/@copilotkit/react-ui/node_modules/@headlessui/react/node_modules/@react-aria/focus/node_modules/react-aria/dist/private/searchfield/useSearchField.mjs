import {useTextField as $054f71d2330da2e3$export$712718f7aec83d5} from "../textfield/useTextField.mjs";
import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import $kb1Sb$intlStringsmjs from "./intlStrings.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";


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



function $44614525ec969a63$export$9bb30bbe003b82e0(props, state, inputRef) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($kb1Sb$intlStringsmjs))), '@react-aria/searchfield');
    let { isDisabled: isDisabled, isReadOnly: isReadOnly, onSubmit: onSubmit, onClear: onClear, type: type = 'search' } = props;
    let onKeyDown = (e)=>{
        const key = e.key;
        if (key === 'Enter' && (isDisabled || isReadOnly)) e.preventDefault();
        if (isDisabled || isReadOnly) return;
        // for backward compatibility;
        // otherwise, "Enter" on an input would trigger a form submit, the default browser behavior
        if (key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit(state.value);
        }
        if (key === 'Escape') {
            // Also check the inputRef value for the case where the value was set directly on the input element instead of going through
            // the hook
            if (state.value === '' && (!inputRef.current || inputRef.current.value === '')) e.continuePropagation();
            else {
                e.preventDefault();
                state.setValue('');
                if (onClear) onClear();
            }
        }
    };
    let onClearButtonClick = ()=>{
        state.setValue('');
        if (onClear) onClear();
    };
    let onPressStart = ()=>{
        // this is in PressStart for mobile so that touching the clear button doesn't remove focus from
        // the input and close the keyboard
        inputRef.current?.focus();
    };
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps, ...validation } = (0, $054f71d2330da2e3$export$712718f7aec83d5)({
        ...props,
        value: state.value,
        onChange: state.setValue,
        onKeyDown: !isReadOnly ? (0, $a4e76a5424781910$export$e08e3b67e392101e)(onKeyDown, props.onKeyDown) : props.onKeyDown,
        type: type
    }, inputRef);
    return {
        labelProps: labelProps,
        inputProps: {
            ...inputProps,
            // already handled by useSearchFieldState
            defaultValue: undefined
        },
        clearButtonProps: {
            'aria-label': stringFormatter.format('Clear search'),
            excludeFromTabOrder: true,
            preventFocusOnPress: true,
            isDisabled: isDisabled || isReadOnly,
            onPress: onClearButtonClick,
            onPressStart: onPressStart
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        ...validation
    };
}


export {$44614525ec969a63$export$9bb30bbe003b82e0 as useSearchField};
//# sourceMappingURL=useSearchField.mjs.map
