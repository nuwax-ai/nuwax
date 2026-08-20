var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $4a053a4bf25e52fb$exports = require("../interactions/focusSafely.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $6d3a394e4e7927ef$exports = require("../overlays/Overlay.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $9X3JZ$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDialog", function () { return $f80cba525f142541$export$d55e7ee900f34e93; });
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





function $f80cba525f142541$export$d55e7ee900f34e93(props, ref) {
    let { role: role = 'dialog' } = props;
    let titleId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    titleId = props['aria-label'] ? undefined : titleId;
    let isRefocusing = (0, $9X3JZ$react.useRef)(false);
    // Focus the dialog itself on mount, unless a child element is already focused.
    (0, $9X3JZ$react.useEffect)(()=>{
        if (ref.current && !(0, $da02ee888921bc9e$exports.isFocusWithin)(ref.current)) {
            (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
            // Safari on iOS does not move the VoiceOver cursor to the dialog
            // or announce that it has opened until it has rendered. A workaround
            // is to wait for half a second, then blur and re-focus the dialog.
            let timeout = setTimeout(()=>{
                // Check that the dialog is still focused, or focused was lost to the body.
                if ((0, $da02ee888921bc9e$exports.getActiveElement)() === ref.current || (0, $da02ee888921bc9e$exports.getActiveElement)() === document.body) {
                    isRefocusing.current = true;
                    if (ref.current) {
                        ref.current.blur();
                        (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
                    }
                    isRefocusing.current = false;
                }
            }, 500);
            return ()=>{
                clearTimeout(timeout);
            };
        }
    }, [
        ref
    ]);
    (0, $6d3a394e4e7927ef$exports.useOverlayFocusContain)();
    // Warn in dev mode if the dialog has no accessible title.
    // This catches a common mistake where useDialog and useOverlayTriggerState
    // are used in the same component, causing the title element to not be
    // in the DOM when useSlotId queries for it.
    // Check the DOM element directly since aria-labelledby may be added by
    // wrapper components (e.g. RAC Dialog uses trigger ID as a fallback).
    let hasWarned = (0, $9X3JZ$react.useRef)(false);
    (0, $9X3JZ$react.useEffect)(()=>{
        if (process.env.NODE_ENV !== 'production' && !hasWarned.current && ref.current) {
            let el = ref.current;
            let hasAriaLabel = el.hasAttribute('aria-label');
            let hasAriaLabelledby = el.hasAttribute('aria-labelledby');
            if (!hasAriaLabel && !hasAriaLabelledby) {
                console.warn("A dialog must have a title for accessibility. Either provide an aria-label or aria-labelledby prop, or render a heading element inside the dialog.");
                hasWarned.current = true;
            }
        }
    });
    // We do not use aria-modal due to a Safari bug which forces the first focusable element to be focused
    // on mount when inside an iframe, no matter which element we programmatically focus.
    // See https://bugs.webkit.org/show_bug.cgi?id=211934.
    // useModal sets aria-hidden on all elements outside the dialog, so the dialog will behave as a modal
    // even without aria-modal on the dialog itself.
    return {
        dialogProps: {
            ...(0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
                labelable: true
            }),
            role: role,
            tabIndex: -1,
            'aria-labelledby': props['aria-labelledby'] || titleId,
            // Prevent blur events from reaching useOverlay, which may cause
            // popovers to close. Since focus is contained within the dialog,
            // we don't want this to occur due to the above useEffect.
            onBlur: (e)=>{
                if (isRefocusing.current) e.stopPropagation();
            }
        },
        titleProps: {
            id: titleId
        }
    };
}


//# sourceMappingURL=useDialog.cjs.map
