var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $5ZMl0$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useToolbar", function () { return $4be8e70c23134915$export$fa142eb1681c520; });
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 





function $4be8e70c23134915$export$fa142eb1681c520(props, ref) {
    const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, orientation: orientation = 'horizontal' } = props;
    let [isInToolbar, setInToolbar] = (0, $5ZMl0$react.useState)(false);
    // should be safe because re-calling set state with the same value it already has is a no-op
    // this will allow us to react should a parent re-render and change its role though
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        setInToolbar(!!(ref.current && ref.current.parentElement?.closest('[role="toolbar"]')));
    });
    const { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    const shouldReverse = direction === 'rtl' && orientation === 'horizontal';
    let focusManager = (0, $9fb4ac1cc58342cc$exports.createFocusManager)(ref);
    const onKeyDown = (e)=>{
        // don't handle portalled events
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) return;
        if (orientation === 'horizontal' && e.key === 'ArrowRight' || orientation === 'vertical' && e.key === 'ArrowDown') {
            if (shouldReverse) focusManager.focusPrevious();
            else focusManager.focusNext();
        } else if (orientation === 'horizontal' && e.key === 'ArrowLeft' || orientation === 'vertical' && e.key === 'ArrowUp') {
            if (shouldReverse) focusManager.focusNext();
            else focusManager.focusPrevious();
        } else if (e.key === 'Tab') {
            // When the tab key is pressed, we want to move focus
            // out of the entire toolbar. To do this, move focus
            // to the first or last focusable child, and let the
            // browser handle the Tab key as usual from there.
            e.stopPropagation();
            lastFocused.current = (0, $da02ee888921bc9e$exports.getActiveElement)();
            if (e.shiftKey) focusManager.focusFirst();
            else focusManager.focusLast();
            return;
        } else // if we didn't handle anything, return early so we don't preventDefault
        return;
        // Prevent arrow keys from being handled by nested action groups.
        e.stopPropagation();
        e.preventDefault();
    };
    // Record the last focused child when focus moves out of the toolbar.
    const lastFocused = (0, $5ZMl0$react.useRef)(null);
    const onBlur = (e)=>{
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, e.relatedTarget) && !lastFocused.current) lastFocused.current = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
    };
    // Restore focus to the last focused child when focus returns into the toolbar.
    // If the element was removed, do nothing, either the first item in the first group,
    // or the last item in the last group will be focused, depending on direction.
    const onFocus = (e)=>{
        if (lastFocused.current && !(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, e.relatedTarget) && (0, $da02ee888921bc9e$exports.nodeContains)(ref.current, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
            lastFocused.current?.focus();
            lastFocused.current = null;
        }
    };
    return {
        toolbarProps: {
            ...(0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
                labelable: true
            }),
            role: !isInToolbar ? 'toolbar' : 'group',
            'aria-orientation': orientation,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabel == null ? ariaLabelledBy : undefined,
            onKeyDownCapture: !isInToolbar ? onKeyDown : undefined,
            onFocusCapture: !isInToolbar ? onFocus : undefined,
            onBlurCapture: !isInToolbar ? onBlur : undefined
        }
    };
}


//# sourceMappingURL=useToolbar.cjs.map
