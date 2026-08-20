import {useToggle as $02953ddad5f95ac5$export$cbe85ee05b554577} from "../toggle/useToggle.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useEffect as $4ptlt$useEffect, useMemo as $4ptlt$useMemo} from "react";

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


function $0fae26137bfab991$export$e375f10ce42261c5(props, state, inputRef) {
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps, isSelected: isSelected, isPressed: isPressed, isDisabled: isDisabled, isReadOnly: isReadOnly, isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = (0, $02953ddad5f95ac5$export$cbe85ee05b554577)(props, state, inputRef);
    let { isIndeterminate: isIndeterminate } = props;
    (0, $4ptlt$useEffect)(()=>{
        // indeterminate is a property, but it can only be set via javascript
        // https://css-tricks.com/indeterminate-checkboxes/
        if (inputRef.current) inputRef.current.indeterminate = !!isIndeterminate;
    });
    return {
        labelProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(labelProps, (0, $4ptlt$useMemo)(()=>({
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


export {$0fae26137bfab991$export$e375f10ce42261c5 as useCheckbox};
//# sourceMappingURL=useCheckbox.js.map
