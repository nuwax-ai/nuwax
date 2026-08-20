var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTooltip", function () { return $4573f02b62afbfb0$export$1c4b08e0eca38426; });
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


function $4573f02b62afbfb0$export$1c4b08e0eca38426(props, state) {
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
        onHoverStart: ()=>state?.open(true),
        onHoverEnd: ()=>state?.close()
    });
    return {
        tooltipProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, hoverProps, {
            role: 'tooltip'
        })
    };
}


//# sourceMappingURL=useTooltip.cjs.map
