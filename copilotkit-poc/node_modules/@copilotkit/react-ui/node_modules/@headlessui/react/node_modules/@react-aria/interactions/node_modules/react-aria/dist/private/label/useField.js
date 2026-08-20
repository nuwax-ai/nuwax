import {useLabel as $6dc0ccf02415c0af$export$8467354a121f1b9f} from "./useLabel.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";

/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 


function $b5d79d79d9c34c91$export$294aa081a6c6f55d(props) {
    let { description: description, errorMessage: errorMessage, isInvalid: isInvalid, validationState: validationState } = props;
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $6dc0ccf02415c0af$export$8467354a121f1b9f)(props);
    let descriptionId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)([
        Boolean(description),
        Boolean(errorMessage),
        isInvalid,
        validationState
    ]);
    let errorMessageId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)([
        Boolean(description),
        Boolean(errorMessage),
        isInvalid,
        validationState
    ]);
    fieldProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(fieldProps, {
        'aria-describedby': [
            descriptionId,
            // Use aria-describedby for error message because aria-errormessage is unsupported using VoiceOver or NVDA. See https://github.com/adobe/react-spectrum/issues/1346#issuecomment-740136268
            errorMessageId,
            props['aria-describedby']
        ].filter(Boolean).join(' ') || undefined
    });
    return {
        labelProps: labelProps,
        fieldProps: fieldProps,
        descriptionProps: {
            id: descriptionId
        },
        errorMessageProps: {
            id: errorMessageId
        }
    };
}


export {$b5d79d79d9c34c91$export$294aa081a6c6f55d as useField};
//# sourceMappingURL=useField.js.map
