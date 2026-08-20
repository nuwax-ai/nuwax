var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $4444d250b7958cf6$exports = require("./useFocusRing.cjs");
var $4SgEm$clsx = require("clsx");
var $4SgEm$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "FocusRing", function () { return $ed330b052730d704$export$1a38b4ad7f578e1d; });
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



function $ed330b052730d704$export$1a38b4ad7f578e1d(props) {
    let { children: children, focusClass: focusClass, focusRingClass: focusRingClass } = props;
    let { isFocused: isFocused, isFocusVisible: isFocusVisible, focusProps: focusProps } = (0, $4444d250b7958cf6$exports.useFocusRing)(props);
    let child = (0, ($parcel$interopDefault($4SgEm$react))).Children.only(children);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($4SgEm$react))).cloneElement(child, (0, $89b39774f3b79dbb$exports.mergeProps)(child.props, {
        ...focusProps,
        className: (0, ($parcel$interopDefault($4SgEm$clsx)))({
            [focusClass || '']: isFocused,
            [focusRingClass || '']: isFocusVisible
        })
    }));
}


//# sourceMappingURL=FocusRing.cjs.map
