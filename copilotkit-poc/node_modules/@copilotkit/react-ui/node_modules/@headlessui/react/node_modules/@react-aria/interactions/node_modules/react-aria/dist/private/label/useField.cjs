var $ec895d26f03379ea$exports = require("./useLabel.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useField", function () { return $e3486d9c44549186$export$294aa081a6c6f55d; });
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


function $e3486d9c44549186$export$294aa081a6c6f55d(props) {
    let { description: description, errorMessage: errorMessage, isInvalid: isInvalid, validationState: validationState } = props;
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $ec895d26f03379ea$exports.useLabel)(props);
    let descriptionId = (0, $7ac82d1fee77eb8a$exports.useSlotId)([
        Boolean(description),
        Boolean(errorMessage),
        isInvalid,
        validationState
    ]);
    let errorMessageId = (0, $7ac82d1fee77eb8a$exports.useSlotId)([
        Boolean(description),
        Boolean(errorMessage),
        isInvalid,
        validationState
    ]);
    fieldProps = (0, $89b39774f3b79dbb$exports.mergeProps)(fieldProps, {
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


//# sourceMappingURL=useField.cjs.map
