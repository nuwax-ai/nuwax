var $3c73045d61be2d91$exports = require("./ariaHideOutside.cjs");
var $79bdf1333d17b238$exports = require("./useOverlay.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $6d3a394e4e7927ef$exports = require("./Overlay.cjs");
var $b5daf4744c764686$exports = require("./usePreventScroll.cjs");
var $ce6v8$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useModalOverlay", function () { return $8b67d9aa2ced1b82$export$dbc0f175b25fb0fb; });
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





function $8b67d9aa2ced1b82$export$dbc0f175b25fb0fb(props, state, ref) {
    let { overlayProps: overlayProps, underlayProps: underlayProps } = (0, $79bdf1333d17b238$exports.useOverlay)({
        ...props,
        isOpen: state.isOpen,
        onClose: state.close
    }, ref);
    (0, $b5daf4744c764686$exports.usePreventScroll)({
        isDisabled: !state.isOpen
    });
    (0, $6d3a394e4e7927ef$exports.useOverlayFocusContain)();
    (0, $ce6v8$react.useEffect)(()=>{
        if (state.isOpen && ref.current) return (0, $3c73045d61be2d91$exports.ariaHideOutside)([
            ref.current
        ], {
            shouldUseInert: true
        });
    }, [
        state.isOpen,
        ref
    ]);
    return {
        modalProps: (0, $89b39774f3b79dbb$exports.mergeProps)(overlayProps),
        underlayProps: underlayProps
    };
}


//# sourceMappingURL=useModalOverlay.cjs.map
