var $6f0f3cb792714c98$exports = require("../grid/useGridSelectionCheckbox.cjs");
var $daad9bac4699131f$exports = require("./utils.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridListSelectionCheckbox", function () { return $e75474c565d6033a$export$e29f2573fabbf7b9; });
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $e75474c565d6033a$export$e29f2573fabbf7b9(props, state) {
    let { key: key } = props;
    const { checkboxProps: checkboxProps } = (0, $6f0f3cb792714c98$exports.useGridSelectionCheckbox)(props, state);
    return {
        checkboxProps: {
            ...checkboxProps,
            'aria-labelledby': `${checkboxProps.id} ${(0, $daad9bac4699131f$exports.getRowId)(state, key)}`
        }
    };
}


//# sourceMappingURL=useGridListSelectionCheckbox.cjs.map
