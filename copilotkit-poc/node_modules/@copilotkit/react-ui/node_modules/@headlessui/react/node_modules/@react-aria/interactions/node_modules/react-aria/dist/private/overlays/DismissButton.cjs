var $769a2a23270d8958$exports = require("./intlStrings.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $3455634180ecf75c$exports = require("../visually-hidden/VisuallyHidden.cjs");
var $kIIId$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "DismissButton", function () { return $09ce686f097958c9$export$2317d149ed6f78c4; });
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




function $09ce686f097958c9$export$2317d149ed6f78c4(props) {
    let { onDismiss: onDismiss, ...otherProps } = props;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($769a2a23270d8958$exports))), '@react-aria/overlays');
    let labels = (0, $3f0180db35edfbf7$exports.useLabels)(otherProps, stringFormatter.format('dismiss'));
    let onClick = ()=>{
        if (onDismiss) onDismiss();
    };
    return /*#__PURE__*/ (0, ($parcel$interopDefault($kIIId$react))).createElement((0, $3455634180ecf75c$exports.VisuallyHidden), null, /*#__PURE__*/ (0, ($parcel$interopDefault($kIIId$react))).createElement("button", {
        ...labels,
        tabIndex: -1,
        onClick: onClick,
        style: {
            width: 1,
            height: 1
        }
    }));
}


//# sourceMappingURL=DismissButton.cjs.map
