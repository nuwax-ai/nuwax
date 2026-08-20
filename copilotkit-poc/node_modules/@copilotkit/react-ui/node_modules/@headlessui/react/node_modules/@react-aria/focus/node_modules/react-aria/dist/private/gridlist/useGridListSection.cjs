var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridListSection", function () { return $5c24f345ccef88ba$export$8a024deed275af3f; });
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

function $5c24f345ccef88ba$export$8a024deed275af3f(props, // eslint-disable-next-line @typescript-eslint/no-unused-vars
state, // eslint-disable-next-line @typescript-eslint/no-unused-vars
ref) {
    let { 'aria-label': ariaLabel } = props;
    let headingId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    let labelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        'aria-label': ariaLabel,
        'aria-labelledby': headingId
    });
    return {
        rowProps: {
            role: 'row'
        },
        rowHeaderProps: {
            id: headingId,
            role: 'rowheader'
        },
        rowGroupProps: {
            role: 'rowgroup',
            ...labelProps
        }
    };
}


//# sourceMappingURL=useGridListSection.cjs.map
