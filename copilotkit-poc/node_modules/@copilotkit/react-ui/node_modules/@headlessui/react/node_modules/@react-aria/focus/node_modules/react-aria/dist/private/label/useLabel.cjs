var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useLabel", function () { return $ec895d26f03379ea$export$8467354a121f1b9f; });
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

function $ec895d26f03379ea$export$8467354a121f1b9f(props) {
    let { id: id, label: label, 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel, labelElementType: labelElementType = 'label' } = props;
    id = (0, $7ac82d1fee77eb8a$exports.useId)(id);
    let labelId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let labelProps = {};
    if (label) {
        ariaLabelledby = ariaLabelledby ? `${labelId} ${ariaLabelledby}` : labelId;
        labelProps = {
            id: labelId,
            htmlFor: labelElementType === 'label' ? id : undefined
        };
    } else if (!ariaLabelledby && !ariaLabel && process.env.NODE_ENV !== 'production') console.warn('If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility');
    let fieldProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        id: id,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledby
    });
    return {
        labelProps: labelProps,
        fieldProps: fieldProps
    };
}


//# sourceMappingURL=useLabel.cjs.map
