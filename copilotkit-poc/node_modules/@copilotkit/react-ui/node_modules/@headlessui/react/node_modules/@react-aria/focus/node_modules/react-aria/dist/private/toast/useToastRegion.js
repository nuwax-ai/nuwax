import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9} from "../interactions/useFocusVisible.js";
import $jPzoh$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";
import {useLandmark as $6ea972a5373aaa15$export$4cc632584fd87fae} from "../landmark/useLandmark.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useRef as $jPzoh$useRef, useCallback as $jPzoh$useCallback, useEffect as $jPzoh$useEffect} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 










function $2f53e21dd3e47e8e$export$b8cbbb20a51697de(props, state, ref) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($jPzoh$intlStringsjs))), '@react-aria/toast');
    let { landmarkProps: landmarkProps } = (0, $6ea972a5373aaa15$export$4cc632584fd87fae)({
        role: 'region',
        'aria-label': props['aria-label'] || stringFormatter.format('notifications', {
            count: state.visibleToasts.length
        })
    }, ref);
    let isHovered = (0, $jPzoh$useRef)(false);
    let isFocused = (0, $jPzoh$useRef)(false);
    let updateTimers = (0, $jPzoh$useCallback)(()=>{
        if (isHovered.current || isFocused.current) state.pauseAll();
        else state.resumeAll();
    }, [
        state
    ]);
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
        onHoverStart: ()=>{
            isHovered.current = true;
            updateTimers();
        },
        onHoverEnd: ()=>{
            isHovered.current = false;
            updateTimers();
        }
    });
    // Manage focus within the toast region.
    // If a focused containing toast is removed, move focus to the next toast, or the previous toast if there is no next toast.
    let toasts = (0, $jPzoh$useRef)([]);
    let prevVisibleToasts = (0, $jPzoh$useRef)(state.visibleToasts);
    let focusedToast = (0, $jPzoh$useRef)(null);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        // If no toast has focus, then don't do anything.
        if (focusedToast.current === -1 || state.visibleToasts.length === 0 || !ref.current) {
            toasts.current = [];
            prevVisibleToasts.current = state.visibleToasts;
            return;
        }
        toasts.current = [
            ...ref.current.querySelectorAll('[role="alertdialog"]')
        ];
        // If the visible toasts haven't changed, we don't need to do anything.
        if (prevVisibleToasts.current.length === state.visibleToasts.length && state.visibleToasts.every((t, i)=>t.key === prevVisibleToasts.current[i].key)) {
            prevVisibleToasts.current = state.visibleToasts;
            return;
        }
        // Get a list of all toasts by index and add info if they are removed.
        let allToasts = prevVisibleToasts.current.map((t, i)=>({
                ...t,
                i: i,
                isRemoved: !state.visibleToasts.some((t2)=>t.key === t2.key)
            }));
        let removedFocusedToastIndex = allToasts.findIndex((t)=>t.i === focusedToast.current && t.isRemoved);
        // If the focused toast was removed, focus the next or previous toast.
        if (removedFocusedToastIndex > -1) {
            var _lastFocused_current;
            // In pointer modality, move focus out of the toast region.
            // Otherwise auto-dismiss timers will appear "stuck".
            if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'pointer' && ((_lastFocused_current = lastFocused.current) === null || _lastFocused_current === void 0 ? void 0 : _lastFocused_current.isConnected)) (0, $d559d872031c749f$export$de79e2c695e052f3)(lastFocused.current);
            else {
                let i = 0;
                let nextToast;
                let prevToast;
                while(i <= removedFocusedToastIndex){
                    if (!allToasts[i].isRemoved) prevToast = Math.max(0, i - 1);
                    i++;
                }
                while(i < allToasts.length){
                    if (!allToasts[i].isRemoved) {
                        nextToast = i - 1;
                        break;
                    }
                    i++;
                }
                // in the case where it's one toast at a time, both will be undefined, but we know the index must be 0
                if (prevToast === undefined && nextToast === undefined) prevToast = 0;
                // prioritize going to newer toasts
                if (prevToast >= 0 && prevToast < toasts.current.length) (0, $d559d872031c749f$export$de79e2c695e052f3)(toasts.current[prevToast]);
                else if (nextToast >= 0 && nextToast < toasts.current.length) (0, $d559d872031c749f$export$de79e2c695e052f3)(toasts.current[nextToast]);
            }
        }
        prevVisibleToasts.current = state.visibleToasts;
    }, [
        state.visibleToasts,
        ref
    ]);
    let lastFocused = (0, $jPzoh$useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        onFocusWithin: (e)=>{
            isFocused.current = true;
            lastFocused.current = e.relatedTarget;
            updateTimers();
        },
        onBlurWithin: ()=>{
            isFocused.current = false;
            lastFocused.current = null;
            updateTimers();
        }
    });
    // When the number of visible toasts becomes 0 or the region unmounts,
    // restore focus to the last element that had focus before the user moved focus
    // into the region. FocusScope restore focus doesn't update whenever the focus
    // moves in, it only happens once, so we correct it.
    // Because we're in a hook, we can't control if the user unmounts or not.
    (0, $jPzoh$useEffect)(()=>{
        var _lastFocused_current;
        if (state.visibleToasts.length === 0 && ((_lastFocused_current = lastFocused.current) === null || _lastFocused_current === void 0 ? void 0 : _lastFocused_current.isConnected)) {
            if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'pointer') (0, $d559d872031c749f$export$de79e2c695e052f3)(lastFocused.current);
            else lastFocused.current.focus();
            lastFocused.current = null;
        }
    }, [
        ref,
        state.visibleToasts.length
    ]);
    (0, $jPzoh$useEffect)(()=>{
        return ()=>{
            var _lastFocused_current;
            if ((_lastFocused_current = lastFocused.current) === null || _lastFocused_current === void 0 ? void 0 : _lastFocused_current.isConnected) {
                if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'pointer') (0, $d559d872031c749f$export$de79e2c695e052f3)(lastFocused.current);
                else lastFocused.current.focus();
                lastFocused.current = null;
            }
        };
    }, [
        ref
    ]);
    return {
        regionProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(landmarkProps, hoverProps, focusWithinProps, {
            tabIndex: -1,
            // Mark the toast region as a "top layer", so that it:
            //   - is not aria-hidden when opening an overlay
            //   - allows focus even outside a containing focus scope
            //   - doesn’t dismiss overlays when clicking on it, even though it is outside
            // @ts-ignore
            'data-react-aria-top-layer': true,
            // listen to focus events separate from focuswithin because that will only fire once
            // and we need to follow all focus changes
            onFocus: (e)=>{
                let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).closest('[role="alertdialog"]');
                focusedToast.current = toasts.current.findIndex((t)=>t === target);
            },
            onBlur: ()=>{
                focusedToast.current = -1;
            }
        })
    };
}


export {$2f53e21dd3e47e8e$export$b8cbbb20a51697de as useToastRegion};
//# sourceMappingURL=useToastRegion.js.map
