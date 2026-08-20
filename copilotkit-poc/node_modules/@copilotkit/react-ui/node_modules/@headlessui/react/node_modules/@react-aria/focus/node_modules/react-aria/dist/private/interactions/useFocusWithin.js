import {createSyntheticEvent as $819bf6b2be9219ca$export$525bc4921d56d4a, setEventTarget as $819bf6b2be9219ca$export$c2b7abe5d61ec696, useSyntheticBlurEvent as $819bf6b2be9219ca$export$715c682d09d639cc} from "./utils.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useRef as $cH00o$useRef, useCallback as $cH00o$useCallback} from "react";

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





function $b842b95ed9b5d4d5$export$420e68273165f4ec(props) {
    let { isDisabled: isDisabled, onBlurWithin: onBlurWithin, onFocusWithin: onFocusWithin, onFocusWithinChange: onFocusWithinChange } = props;
    let state = (0, $cH00o$useRef)({
        isFocusWithin: false
    });
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let onBlur = (0, $cH00o$useCallback)((e)=>{
        // Ignore events bubbling through portals.
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        // We don't want to trigger onBlurWithin and then immediately onFocusWithin again
        // when moving focus inside the element. Only trigger if the currentTarget doesn't
        // include the relatedTarget (where focus is moving).
        if (state.current.isFocusWithin && !(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget)) {
            state.current.isFocusWithin = false;
            removeAllGlobalListeners();
            if (onBlurWithin) onBlurWithin(e);
            if (onFocusWithinChange) onFocusWithinChange(false);
        }
    }, [
        onBlurWithin,
        onFocusWithinChange,
        state,
        removeAllGlobalListeners
    ]);
    let onSyntheticFocus = (0, $819bf6b2be9219ca$export$715c682d09d639cc)(onBlur);
    let onFocus = (0, $cH00o$useCallback)((e)=>{
        // Ignore events bubbling through portals.
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        // Double check that document.activeElement actually matches e.target in case a previously chained
        // focus handler already moved focus somewhere else.
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        const ownerDocument = (0, $cc3c3666b64debad$export$b204af158042fbac)(eventTarget);
        const activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)(ownerDocument);
        if (!state.current.isFocusWithin && activeElement === eventTarget) {
            if (onFocusWithin) onFocusWithin(e);
            if (onFocusWithinChange) onFocusWithinChange(true);
            state.current.isFocusWithin = true;
            onSyntheticFocus(e);
            // Browsers don't fire blur events when elements are removed from the DOM.
            // However, if a focus event occurs outside the element we're tracking, we
            // can manually fire onBlur.
            let currentTarget = e.currentTarget;
            addGlobalListener(ownerDocument, 'focus', (e)=>{
                let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                if (state.current.isFocusWithin && !(0, $d8ac7ed472840322$export$4282f70798064fe0)(currentTarget, eventTarget)) {
                    let nativeEvent = new ownerDocument.defaultView.FocusEvent('blur', {
                        relatedTarget: eventTarget
                    });
                    (0, $819bf6b2be9219ca$export$c2b7abe5d61ec696)(nativeEvent, currentTarget);
                    let event = (0, $819bf6b2be9219ca$export$525bc4921d56d4a)(nativeEvent);
                    onBlur(event);
                }
            }, {
                capture: true
            });
        }
    }, [
        onFocusWithin,
        onFocusWithinChange,
        onSyntheticFocus,
        addGlobalListener,
        onBlur
    ]);
    if (isDisabled) return {
        focusWithinProps: {
            // These cannot be null, that would conflict in mergeProps
            onFocus: undefined,
            onBlur: undefined
        }
    };
    return {
        focusWithinProps: {
            onFocus: onFocus,
            onBlur: onBlur
        }
    };
}


export {$b842b95ed9b5d4d5$export$420e68273165f4ec as useFocusWithin};
//# sourceMappingURL=useFocusWithin.js.map
