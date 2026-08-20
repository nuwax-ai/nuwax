var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $543a9cb5084fed6a$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");
var $e7d6db9a26301a97$exports = require("../landmark/useLandmark.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $acHLJ$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToastRegion", function () { return $1ee97da2e501f1cb$export$b8cbbb20a51697de; });
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










function $1ee97da2e501f1cb$export$b8cbbb20a51697de(props, state, ref) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($543a9cb5084fed6a$exports))), '@react-aria/toast');
    let { landmarkProps: landmarkProps } = (0, $e7d6db9a26301a97$exports.useLandmark)({
        role: 'region',
        'aria-label': props['aria-label'] || stringFormatter.format('notifications', {
            count: state.visibleToasts.length
        })
    }, ref);
    let isHovered = (0, $acHLJ$react.useRef)(false);
    let isFocused = (0, $acHLJ$react.useRef)(false);
    let updateTimers = (0, $acHLJ$react.useCallback)(()=>{
        if (isHovered.current || isFocused.current) state.pauseAll();
        else state.resumeAll();
    }, [
        state
    ]);
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
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
    let toasts = (0, $acHLJ$react.useRef)([]);
    let prevVisibleToasts = (0, $acHLJ$react.useRef)(state.visibleToasts);
    let focusedToast = (0, $acHLJ$react.useRef)(null);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
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
            // In pointer modality, move focus out of the toast region.
            // Otherwise auto-dismiss timers will appear "stuck".
            if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'pointer' && lastFocused.current?.isConnected) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(lastFocused.current);
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
                if (prevToast >= 0 && prevToast < toasts.current.length) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(toasts.current[prevToast]);
                else if (nextToast >= 0 && nextToast < toasts.current.length) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(toasts.current[nextToast]);
            }
        }
        prevVisibleToasts.current = state.visibleToasts;
    }, [
        state.visibleToasts,
        ref
    ]);
    let lastFocused = (0, $acHLJ$react.useRef)(null);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
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
    (0, $acHLJ$react.useEffect)(()=>{
        if (state.visibleToasts.length === 0 && lastFocused.current?.isConnected) {
            if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'pointer') (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(lastFocused.current);
            else lastFocused.current.focus();
            lastFocused.current = null;
        }
    }, [
        ref,
        state.visibleToasts.length
    ]);
    (0, $acHLJ$react.useEffect)(()=>{
        return ()=>{
            if (lastFocused.current?.isConnected) {
                if ((0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'pointer') (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(lastFocused.current);
                else lastFocused.current.focus();
                lastFocused.current = null;
            }
        };
    }, [
        ref
    ]);
    return {
        regionProps: (0, $89b39774f3b79dbb$exports.mergeProps)(landmarkProps, hoverProps, focusWithinProps, {
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
                let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e).closest('[role="alertdialog"]');
                focusedToast.current = toasts.current.findIndex((t)=>t === target);
            },
            onBlur: ()=>{
                focusedToast.current = -1;
            }
        })
    };
}


//# sourceMappingURL=useToastRegion.cjs.map
