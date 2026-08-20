import {ClearPressResponder as $0d47b37c475c5231$export$cf75428e0b9ed1ea} from "../interactions/PressResponder.mjs";
import {FocusScope as $535772f9d2c1f38d$export$20e40289641fbbb6} from "../focus/FocusScope.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useUNSAFE_PortalContext as $72abaeab4d80592f$export$9fc1347d4195ccb3} from "./PortalProvider.mjs";
import $3wX5A$react, {useState as $3wX5A$useState, useMemo as $3wX5A$useMemo, useContext as $3wX5A$useContext} from "react";
import $3wX5A$reactdom from "react-dom";

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






const $d7a937236970dc7f$export$a2200b96afd16271 = /*#__PURE__*/ (0, $3wX5A$react).createContext(null);
function $d7a937236970dc7f$export$c6fdb837b070b4ff(props) {
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, isExiting: isExiting } = props;
    let [contain, setContain] = (0, $3wX5A$useState)(false);
    let contextValue = (0, $3wX5A$useMemo)(()=>({
            contain: contain,
            setContain: setContain
        }), [
        contain,
        setContain
    ]);
    let { getContainer: getContainer } = (0, $72abaeab4d80592f$export$9fc1347d4195ccb3)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    if (!portalContainer) return null;
    let contents = props.children;
    if (!props.disableFocusManagement) contents = /*#__PURE__*/ (0, $3wX5A$react).createElement((0, $535772f9d2c1f38d$export$20e40289641fbbb6), {
        restoreFocus: true,
        contain: (props.shouldContainFocus || contain) && !isExiting
    }, contents);
    contents = /*#__PURE__*/ (0, $3wX5A$react).createElement($d7a937236970dc7f$export$a2200b96afd16271.Provider, {
        value: contextValue
    }, /*#__PURE__*/ (0, $3wX5A$react).createElement((0, $0d47b37c475c5231$export$cf75428e0b9ed1ea), null, contents));
    return /*#__PURE__*/ (0, $3wX5A$reactdom).createPortal(contents, portalContainer);
}
function $d7a937236970dc7f$export$14c98a7594375490() {
    let ctx = (0, $3wX5A$useContext)($d7a937236970dc7f$export$a2200b96afd16271);
    let setContain = ctx?.setContain;
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        setContain?.(true);
    }, [
        setContain
    ]);
}


export {$d7a937236970dc7f$export$a2200b96afd16271 as OverlayContext, $d7a937236970dc7f$export$c6fdb837b070b4ff as Overlay, $d7a937236970dc7f$export$14c98a7594375490 as useOverlayFocusContain};
//# sourceMappingURL=Overlay.mjs.map
