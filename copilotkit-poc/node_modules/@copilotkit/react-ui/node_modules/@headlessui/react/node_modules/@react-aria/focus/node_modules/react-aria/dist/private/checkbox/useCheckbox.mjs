import {useToggle as $876b6f32ca5a04c3$export$cbe85ee05b554577} from "../toggle/useToggle.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useEffect as $5eYZN$useEffect, useMemo as $5eYZN$useMemo} from "react";

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


function $dde212bea465bd23$export$e375f10ce42261c5(props, state, inputRef) {
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps, isSelected: isSelected, isPressed: isPressed, isDisabled: isDisabled, isReadOnly: isReadOnly, isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = (0, $876b6f32ca5a04c3$export$cbe85ee05b554577)(props, state, inputRef);
    let { isIndeterminate: isIndeterminate } = props;
    (0, $5eYZN$useEffect)(()=>{
        // indeterminate is a property, but it can only be set via javascript
        // https://css-tricks.com/indeterminate-checkboxes/
        if (inputRef.current) inputRef.current.indeterminate = !!isIndeterminate;
    });
    return {
        labelProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(labelProps, (0, $5eYZN$useMemo)(()=>({
                // Prevent label from being focused when mouse down on it.
                // Note, this does not prevent the input from being focused in the `click` event.
                onMouseDown: (e)=>e.preventDefault()
            }), [])),
        inputProps: inputProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isSelected: isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


export {$dde212bea465bd23$export$e375f10ce42261c5 as useCheckbox};
//# sourceMappingURL=useCheckbox.mjs.map
