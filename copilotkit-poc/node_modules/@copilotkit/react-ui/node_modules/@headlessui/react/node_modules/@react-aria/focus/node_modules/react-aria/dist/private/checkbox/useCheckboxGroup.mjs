import {checkboxGroupData as $0fffd24394d22962$export$ec98120685d4f57d} from "./utils.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useField as $191c9b6d48a0a4e2$export$294aa081a6c6f55d} from "../label/useField.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";

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




function $d11d85ad4808f162$export$49ff6f28c54f1cbe(props, state) {
    let { isDisabled: isDisabled, name: name, form: form, validationBehavior: validationBehavior = 'aria' } = props;
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $191c9b6d48a0a4e2$export$294aa081a6c6f55d)({
        ...props,
        // Checkbox group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    (0, $0fffd24394d22962$export$ec98120685d4f57d).set(state, {
        name: name,
        form: form,
        descriptionId: descriptionProps.id,
        errorMessageId: errorMessageProps.id,
        validationBehavior: validationBehavior
    });
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        onBlurWithin: props.onBlur,
        onFocusWithin: props.onFocus,
        onFocusWithinChange: props.onFocusChange
    });
    return {
        groupProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, {
            role: 'group',
            'aria-disabled': isDisabled || undefined,
            ...fieldProps,
            ...focusWithinProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


export {$d11d85ad4808f162$export$49ff6f28c54f1cbe as useCheckboxGroup};
//# sourceMappingURL=useCheckboxGroup.mjs.map
