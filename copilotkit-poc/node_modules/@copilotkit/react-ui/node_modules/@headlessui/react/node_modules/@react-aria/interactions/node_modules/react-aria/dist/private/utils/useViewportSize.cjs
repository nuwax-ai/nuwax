var $da02ee888921bc9e$exports = require("./shadowdom/DOMFunctions.cjs");
var $d0b4a781cf26e80b$exports = require("./platform.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $d74c59468d7890a7$exports = require("./keyboard.cjs");
var $29jYn$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useViewportSize", function () { return $d081a18ad0be17db$export$d699905dd57c73ca; });
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




let $d081a18ad0be17db$var$visualViewport = typeof document !== 'undefined' && window.visualViewport;
function $d081a18ad0be17db$export$d699905dd57c73ca() {
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let [size, setSize] = (0, $29jYn$react.useState)(()=>isSSR ? {
            width: 0,
            height: 0
        } : $d081a18ad0be17db$var$getViewportSize());
    (0, $29jYn$react.useEffect)(()=>{
        let updateSize = (newSize)=>{
            setSize((size)=>{
                if (newSize.width === size.width && newSize.height === size.height) return size;
                return newSize;
            });
        };
        // Use visualViewport api to track available height even on iOS virtual keyboard opening
        let onResize = ()=>{
            // Ignore updates when zoomed.
            if ($d081a18ad0be17db$var$visualViewport && $d081a18ad0be17db$var$visualViewport.scale > 1) return;
            updateSize($d081a18ad0be17db$var$getViewportSize());
        };
        // When closing the keyboard, iOS does not fire the visual viewport resize event until the animation is complete.
        // We can anticipate this and resize early by handling the blur event and using the layout size.
        let frame;
        let onBlur = (e)=>{
            if ($d081a18ad0be17db$var$visualViewport && $d081a18ad0be17db$var$visualViewport.scale > 1) return;
            if ((0, $d74c59468d7890a7$exports.willOpenKeyboard)((0, $da02ee888921bc9e$exports.getEventTarget)(e))) // Wait one frame to see if a new element gets focused.
            frame = requestAnimationFrame(()=>{
                let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)();
                if (!activeElement || !(0, $d74c59468d7890a7$exports.willOpenKeyboard)(activeElement)) updateSize({
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                });
            });
        };
        updateSize($d081a18ad0be17db$var$getViewportSize());
        if ((0, $d0b4a781cf26e80b$exports.isIOS)()) window.addEventListener('blur', onBlur, true);
        if (!$d081a18ad0be17db$var$visualViewport) window.addEventListener('resize', onResize);
        else $d081a18ad0be17db$var$visualViewport.addEventListener('resize', onResize);
        return ()=>{
            cancelAnimationFrame(frame);
            if ((0, $d0b4a781cf26e80b$exports.isIOS)()) window.removeEventListener('blur', onBlur, true);
            if (!$d081a18ad0be17db$var$visualViewport) window.removeEventListener('resize', onResize);
            else $d081a18ad0be17db$var$visualViewport.removeEventListener('resize', onResize);
        };
    }, []);
    return size;
}
/**
 * Get the viewport size without the scrollbar.
 */ function $d081a18ad0be17db$var$getViewportSize() {
    return {
        // Multiply by the visualViewport scale to get the "natural" size, unaffected by pinch zooming.
        width: $d081a18ad0be17db$var$visualViewport ? // the visual viewport and the document element to ensure that the scrollbar width is always excluded.
        // See: https://github.com/w3c/csswg-drafts/issues/8099
        Math.min($d081a18ad0be17db$var$visualViewport.width * $d081a18ad0be17db$var$visualViewport.scale, document.documentElement.clientWidth) : document.documentElement.clientWidth,
        height: $d081a18ad0be17db$var$visualViewport ? $d081a18ad0be17db$var$visualViewport.height * $d081a18ad0be17db$var$visualViewport.scale : document.documentElement.clientHeight
    };
}


//# sourceMappingURL=useViewportSize.cjs.map
