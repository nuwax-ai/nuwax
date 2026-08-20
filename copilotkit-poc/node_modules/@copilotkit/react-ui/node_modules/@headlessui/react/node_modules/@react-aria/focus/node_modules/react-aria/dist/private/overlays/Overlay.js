import {ClearPressResponder as $5d4e6730a3d5484c$export$cf75428e0b9ed1ea} from "../interactions/PressResponder.js";
import {FocusScope as $903814aeb7d53b38$export$20e40289641fbbb6} from "../focus/FocusScope.js";
import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useUNSAFE_PortalContext as $1255006bb8b1b64a$export$9fc1347d4195ccb3} from "./PortalProvider.js";
import $iVJFK$react, {useState as $iVJFK$useState, useMemo as $iVJFK$useMemo, useContext as $iVJFK$useContext} from "react";
import $iVJFK$reactdom from "react-dom";

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 






const $0a6ccf9bf972d929$export$a2200b96afd16271 = /*#__PURE__*/ (0, $iVJFK$react).createContext(null);
function $0a6ccf9bf972d929$export$c6fdb837b070b4ff(props) {
    let isSSR = (0, $85138adc03e1f057$export$535bd6ca7f90a273)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, isExiting: isExiting } = props;
    let [contain, setContain] = (0, $iVJFK$useState)(false);
    let contextValue = (0, $iVJFK$useMemo)(()=>({
            contain: contain,
            setContain: setContain
        }), [
        contain,
        setContain
    ]);
    let { getContainer: getContainer } = (0, $1255006bb8b1b64a$export$9fc1347d4195ccb3)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    if (!portalContainer) return null;
    let contents = props.children;
    if (!props.disableFocusManagement) contents = /*#__PURE__*/ (0, $iVJFK$react).createElement((0, $903814aeb7d53b38$export$20e40289641fbbb6), {
        restoreFocus: true,
        contain: (props.shouldContainFocus || contain) && !isExiting
    }, contents);
    contents = /*#__PURE__*/ (0, $iVJFK$react).createElement($0a6ccf9bf972d929$export$a2200b96afd16271.Provider, {
        value: contextValue
    }, /*#__PURE__*/ (0, $iVJFK$react).createElement((0, $5d4e6730a3d5484c$export$cf75428e0b9ed1ea), null, contents));
    return /*#__PURE__*/ (0, $iVJFK$reactdom).createPortal(contents, portalContainer);
}
function $0a6ccf9bf972d929$export$14c98a7594375490() {
    let ctx = (0, $iVJFK$useContext)($0a6ccf9bf972d929$export$a2200b96afd16271);
    let setContain = ctx === null || ctx === void 0 ? void 0 : ctx.setContain;
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        setContain === null || setContain === void 0 ? void 0 : setContain(true);
    }, [
        setContain
    ]);
}


export {$0a6ccf9bf972d929$export$a2200b96afd16271 as OverlayContext, $0a6ccf9bf972d929$export$c6fdb837b070b4ff as Overlay, $0a6ccf9bf972d929$export$14c98a7594375490 as useOverlayFocusContain};
//# sourceMappingURL=Overlay.js.map
