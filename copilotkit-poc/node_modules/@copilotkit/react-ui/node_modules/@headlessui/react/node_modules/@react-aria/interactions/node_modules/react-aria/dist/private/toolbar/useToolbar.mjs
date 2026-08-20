import {createFocusManager as $535772f9d2c1f38d$export$c5251b9e124bf29} from "../focus/FocusScope.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useState as $jBcN3$useState, useRef as $jBcN3$useRef} from "react";

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





function $afa781ff67c1cd08$export$fa142eb1681c520(props, ref) {
    const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, orientation: orientation = 'horizontal' } = props;
    let [isInToolbar, setInToolbar] = (0, $jBcN3$useState)(false);
    // should be safe because re-calling set state with the same value it already has is a no-op
    // this will allow us to react should a parent re-render and change its role though
    // eslint-disable-next-line react-hooks/exhaustive-deps
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        setInToolbar(!!(ref.current && ref.current.parentElement?.closest('[role="toolbar"]')));
    });
    const { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    const shouldReverse = direction === 'rtl' && orientation === 'horizontal';
    let focusManager = (0, $535772f9d2c1f38d$export$c5251b9e124bf29)(ref);
    const onKeyDown = (e)=>{
        // don't handle portalled events
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) return;
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
            lastFocused.current = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
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
    const lastFocused = (0, $jBcN3$useRef)(null);
    const onBlur = (e)=>{
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget) && !lastFocused.current) lastFocused.current = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
    };
    // Restore focus to the last focused child when focus returns into the toolbar.
    // If the element was removed, do nothing, either the first item in the first group,
    // or the last item in the last group will be focused, depending on direction.
    const onFocus = (e)=>{
        if (lastFocused.current && !(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget) && (0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
            lastFocused.current?.focus();
            lastFocused.current = null;
        }
    };
    return {
        toolbarProps: {
            ...(0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
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


export {$afa781ff67c1cd08$export$fa142eb1681c520 as useToolbar};
//# sourceMappingURL=useToolbar.mjs.map
