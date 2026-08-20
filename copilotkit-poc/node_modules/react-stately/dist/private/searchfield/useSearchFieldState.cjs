var $14cedf286405cc4b$exports = require("../utils/useControlledState.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSearchFieldState", function () { return $5e77a61737ec8ceb$export$3f8be18b0f41eaf2; });
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
function $5e77a61737ec8ceb$export$3f8be18b0f41eaf2(props) {
    let [value, setValue] = (0, $14cedf286405cc4b$exports.useControlledState)($5e77a61737ec8ceb$var$toString(props.value), $5e77a61737ec8ceb$var$toString(props.defaultValue) || '', props.onChange);
    return {
        value: value,
        setValue: setValue
    };
}
function $5e77a61737ec8ceb$var$toString(val) {
    if (val == null) return;
    return val.toString();
}


//# sourceMappingURL=useSearchFieldState.cjs.map
