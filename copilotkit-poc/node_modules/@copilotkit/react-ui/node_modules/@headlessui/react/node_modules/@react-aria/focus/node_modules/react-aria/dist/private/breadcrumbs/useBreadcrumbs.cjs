var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $c6a89cb4ff2694d2$exports = require("./intlStrings.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useBreadcrumbs", function () { return $954fa9207cf67703$export$8cefe241bd876ca0; });
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


function $954fa9207cf67703$export$8cefe241bd876ca0(props) {
    let { 'aria-label': ariaLabel, ...otherProps } = props;
    let strings = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($c6a89cb4ff2694d2$exports))), '@react-aria/breadcrumbs');
    return {
        navProps: {
            ...(0, $b97366b6eabbb2cc$exports.filterDOMProps)(otherProps, {
                labelable: true
            }),
            'aria-label': ariaLabel || strings.format('breadcrumbs')
        }
    };
}


//# sourceMappingURL=useBreadcrumbs.cjs.map
