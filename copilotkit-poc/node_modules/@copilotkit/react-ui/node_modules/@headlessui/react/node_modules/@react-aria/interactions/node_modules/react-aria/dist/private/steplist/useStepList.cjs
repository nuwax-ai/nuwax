var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $23b29024fccd8bdf$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $6c3cc4646da74e51$exports = require("../selection/useSelectableList.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useStepList", function () { return $0b13101c1a73796a$export$c51c7b7354499d04; });
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $0b13101c1a73796a$export$c51c7b7354499d04(props, state, ref) {
    let { 'aria-label': ariaLabel } = props;
    let { listProps: listProps } = (0, $6c3cc4646da74e51$exports.useSelectableList)({
        ...props,
        ...state,
        allowsTabNavigation: true,
        ref: ref
    });
    const strings = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($23b29024fccd8bdf$exports))), '@react-aria/steplist');
    const stepListProps = {
        ...(0, $89b39774f3b79dbb$exports.mergeProps)(listProps, (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
            labelable: true
        })),
        'aria-label': ariaLabel || strings.format('steplist')
    };
    return {
        listProps: {
            ...stepListProps,
            tabIndex: undefined
        }
    };
}


//# sourceMappingURL=useStepList.cjs.map
