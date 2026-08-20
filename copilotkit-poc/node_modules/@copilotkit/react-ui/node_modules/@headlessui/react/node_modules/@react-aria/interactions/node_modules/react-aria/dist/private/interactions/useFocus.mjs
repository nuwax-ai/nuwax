import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";
import {useSyntheticBlurEvent as $a92dc41f639950be$export$715c682d09d639cc} from "./utils.mjs";
import {useCallback as $3siB1$useCallback} from "react";

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




function $1e74c67db218ce67$export$f8168d8dd8fd66e6(props) {
    let { isDisabled: isDisabled, onFocus: onFocusProp, onBlur: onBlurProp, onFocusChange: onFocusChange } = props;
    const onBlur = (0, $3siB1$useCallback)((e)=>{
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === e.currentTarget) {
            if (onBlurProp) onBlurProp(e);
            if (onFocusChange) onFocusChange(false);
            return true;
        }
    }, [
        onBlurProp,
        onFocusChange
    ]);
    const onSyntheticFocus = (0, $a92dc41f639950be$export$715c682d09d639cc)(onBlur);
    const onFocus = (0, $3siB1$useCallback)((e)=>{
        // Double check that document.activeElement actually matches e.target in case a previously chained
        // focus handler already moved focus somewhere else.
        let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(eventTarget);
        const activeElement = ownerDocument ? (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument) : (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
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


export {$1e74c67db218ce67$export$f8168d8dd8fd66e6 as useFocus};
//# sourceMappingURL=useFocus.mjs.map
