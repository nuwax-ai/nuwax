var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $a9918c67a493892d$exports = require("./utils.cjs");
var $d5gLO$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useFocus", function () { return $5e1a09eb20a4a484$export$f8168d8dd8fd66e6; });
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
 */ // Portions of the code in this file are based on code from react.
// Original licensing for the following can be found in the
// NOTICE file in the root directory of this source tree.
// See https://github.com/facebook/react/tree/cc7c1aece46a6b69b41958d731e0fd27c94bfc6c/packages/react-interactions




function $5e1a09eb20a4a484$export$f8168d8dd8fd66e6(props) {
    let { isDisabled: isDisabled, onFocus: onFocusProp, onBlur: onBlurProp, onFocusChange: onFocusChange } = props;
    const onBlur = (0, $d5gLO$react.useCallback)((e)=>{
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === e.currentTarget) {
            if (onBlurProp) onBlurProp(e);
            if (onFocusChange) onFocusChange(false);
            return true;
        }
    }, [
        onBlurProp,
        onFocusChange
    ]);
    const onSyntheticFocus = (0, $a9918c67a493892d$exports.useSyntheticBlurEvent)(onBlur);
    const onFocus = (0, $d5gLO$react.useCallback)((e)=>{
        // Double check that document.activeElement actually matches e.target in case a previously chained
        // focus handler already moved focus somewhere else.
        let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(eventTarget);
        const activeElement = ownerDocument ? (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument) : (0, $da02ee888921bc9e$exports.getActiveElement)();
        if (eventTarget === e.currentTarget && eventTarget === activeElement) {
            if (onFocusProp) onFocusProp(e);
            if (onFocusChange) onFocusChange(true);
            onSyntheticFocus(e);
        }
    }, [
        onFocusChange,
        onFocusProp,
        onSyntheticFocus
    ]);
    return {
        focusProps: {
            onFocus: !isDisabled && (onFocusProp || onFocusChange || onBlurProp) ? onFocus : undefined,
            onBlur: !isDisabled && (onBlurProp || onFocusChange) ? onBlur : undefined
        }
    };
}


//# sourceMappingURL=useFocus.cjs.map
