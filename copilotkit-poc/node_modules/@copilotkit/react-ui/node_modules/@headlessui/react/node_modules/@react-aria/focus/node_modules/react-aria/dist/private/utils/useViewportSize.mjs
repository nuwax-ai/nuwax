import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "./shadowdom/DOMFunctions.mjs";
import {isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1} from "./platform.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {willOpenKeyboard as $bb39c0fc1c19b34c$export$c57958e35f31ed73} from "./keyboard.mjs";
import {useState as $99N2Z$useState, useEffect as $99N2Z$useEffect} from "react";

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




let $6066a2c586ade9e1$var$visualViewport = typeof document !== 'undefined' && window.visualViewport;
function $6066a2c586ade9e1$export$d699905dd57c73ca() {
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let [size, setSize] = (0, $99N2Z$useState)(()=>isSSR ? {
            width: 0,
            height: 0
        } : $6066a2c586ade9e1$var$getViewportSize());
    (0, $99N2Z$useEffect)(()=>{
        let updateSize = (newSize)=>{
            setSize((size)=>{
                if (newSize.width === size.width && newSize.height === size.height) return size;
                return newSize;
            });
        };
        // Use visualViewport api to track available height even on iOS virtual keyboard opening
        let onResize = ()=>{
            // Ignore updates when zoomed.
            if ($6066a2c586ade9e1$var$visualViewport && $6066a2c586ade9e1$var$visualViewport.scale > 1) return;
            updateSize($6066a2c586ade9e1$var$getViewportSize());
        };
        // When closing the keyboard, iOS does not fire the visual viewport resize event until the animation is complete.
        // We can anticipate this and resize early by handling the blur event and using the layout size.
        let frame;
        let onBlur = (e)=>{
            if ($6066a2c586ade9e1$var$visualViewport && $6066a2c586ade9e1$var$visualViewport.scale > 1) return;
            if ((0, $bb39c0fc1c19b34c$export$c57958e35f31ed73)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) // Wait one frame to see if a new element gets focused.
            frame = requestAnimationFrame(()=>{
                let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
                if (!activeElement || !(0, $bb39c0fc1c19b34c$export$c57958e35f31ed73)(activeElement)) updateSize({
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                });
            });
        };
        updateSize($6066a2c586ade9e1$var$getViewportSize());
        if ((0, $2add3ce32c6007eb$export$fedb369cb70207f1)()) window.addEventListener('blur', onBlur, true);
        if (!$6066a2c586ade9e1$var$visualViewport) window.addEventListener('resize', onResize);
        else $6066a2c586ade9e1$var$visualViewport.addEventListener('resize', onResize);
        return ()=>{
            cancelAnimationFrame(frame);
            if ((0, $2add3ce32c6007eb$export$fedb369cb70207f1)()) window.removeEventListener('blur', onBlur, true);
            if (!$6066a2c586ade9e1$var$visualViewport) window.removeEventListener('resize', onResize);
            else $6066a2c586ade9e1$var$visualViewport.removeEventListener('resize', onResize);
        };
    }, []);
    return size;
}
/**
 * Get the viewport size without the scrollbar.
 */ function $6066a2c586ade9e1$var$getViewportSize() {
    return {
        // Multiply by the visualViewport scale to get the "natural" size, unaffected by pinch zooming.
        width: $6066a2c586ade9e1$var$visualViewport ? // the visual viewport and the document element to ensure that the scrollbar width is always excluded.
        // See: https://github.com/w3c/csswg-drafts/issues/8099
        Math.min($6066a2c586ade9e1$var$visualViewport.width * $6066a2c586ade9e1$var$visualViewport.scale, document.documentElement.clientWidth) : document.documentElement.clientWidth,
        height: $6066a2c586ade9e1$var$visualViewport ? $6066a2c586ade9e1$var$visualViewport.height * $6066a2c586ade9e1$var$visualViewport.scale : document.documentElement.clientHeight
    };
}


export {$6066a2c586ade9e1$export$d699905dd57c73ca as useViewportSize};
//# sourceMappingURL=useViewportSize.mjs.map
