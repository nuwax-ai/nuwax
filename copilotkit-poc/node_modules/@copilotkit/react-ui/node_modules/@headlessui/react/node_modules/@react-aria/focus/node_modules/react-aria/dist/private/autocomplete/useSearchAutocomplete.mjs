import {useSearchField as $44614525ec969a63$export$9bb30bbe003b82e0} from "../searchfield/useSearchField.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useComboBox as $bf505c7417d9b616$export$8c18d1b4f7232bbf} from "../combobox/useComboBox.mjs";

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


function $1a45c372eaffa320$export$da7ade746446be1f(props, state) {
    let { popoverRef: popoverRef, inputRef: inputRef, listBoxRef: listBoxRef, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, onSubmit: onSubmit = ()=>{}, onClear: onClear, onKeyDown: onKeyDown, onKeyUp: onKeyUp, isInvalid: isInvalid, validationState: validationState, validationBehavior: validationBehavior, isRequired: isRequired, ...otherProps } = props;
    let { inputProps: inputProps, clearButtonProps: clearButtonProps } = (0, $44614525ec969a63$export$9bb30bbe003b82e0)({
        ...otherProps,
        value: state.inputValue,
        onChange: state.setInputValue,
        autoComplete: 'off',
        onClear: ()=>{
            state.setInputValue('');
            if (onClear) onClear();
        },
        onSubmit: (value)=>{
            // Prevent submission from search field if menu item was selected
            if (state.selectionManager.focusedKey === null) onSubmit(value, null);
        },
        onKeyDown: onKeyDown,
        onKeyUp: onKeyUp
    }, {
        value: state.inputValue,
        setValue: state.setInputValue
    }, inputRef);
    let { listBoxProps: listBoxProps, labelProps: labelProps, inputProps: comboBoxInputProps, ...validation } = (0, $bf505c7417d9b616$export$8c18d1b4f7232bbf)({
        ...otherProps,
        keyboardDelegate: keyboardDelegate,
        layoutDelegate: layoutDelegate,
        popoverRef: popoverRef,
        listBoxRef: listBoxRef,
        inputRef: inputRef,
        onFocus: undefined,
        onFocusChange: undefined,
        onBlur: undefined,
        onKeyDown: undefined,
        onKeyUp: undefined,
        isInvalid: isInvalid,
        validationState: validationState,
        validationBehavior: validationBehavior,
        isRequired: isRequired,
        validate: undefined
    }, state);
    return {
        labelProps: labelProps,
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(inputProps, comboBoxInputProps),
        listBoxProps: listBoxProps,
        clearButtonProps: clearButtonProps,
        ...validation
    };
}


export {$1a45c372eaffa320$export$da7ade746446be1f as useSearchAutocomplete};
//# sourceMappingURL=useSearchAutocomplete.mjs.map
