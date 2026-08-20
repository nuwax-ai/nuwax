var $271711dcf3cbfb6a$exports = require("../interactions/PressResponder.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $08e343b750af304b$exports = require("./PortalProvider.cjs");
var $gvH4Z$react = require("react");
var $gvH4Z$reactdom = require("react-dom");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "Overlay", function () { return $6d3a394e4e7927ef$export$c6fdb837b070b4ff; });
$parcel$export(module.exports, "useOverlayFocusContain", function () { return $6d3a394e4e7927ef$export$14c98a7594375490; });
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






const $6d3a394e4e7927ef$export$a2200b96afd16271 = /*#__PURE__*/ (0, ($parcel$interopDefault($gvH4Z$react))).createContext(null);
function $6d3a394e4e7927ef$export$c6fdb837b070b4ff(props) {
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let { portalContainer: portalContainer = isSSR ? null : document.body, isExiting: isExiting } = props;
    let [contain, setContain] = (0, $gvH4Z$react.useState)(false);
    let contextValue = (0, $gvH4Z$react.useMemo)(()=>({
            contain: contain,
            setContain: setContain
        }), [
        contain,
        setContain
    ]);
    let { getContainer: getContainer } = (0, $08e343b750af304b$exports.useUNSAFE_PortalContext)();
    if (!props.portalContainer && getContainer) portalContainer = getContainer();
    if (!portalContainer) return null;
    let contents = props.children;
    if (!props.disableFocusManagement) contents = /*#__PURE__*/ (0, ($parcel$interopDefault($gvH4Z$react))).createElement((0, $9fb4ac1cc58342cc$exports.FocusScope), {
        restoreFocus: true,
        contain: (props.shouldContainFocus || contain) && !isExiting
    }, contents);
    contents = /*#__PURE__*/ (0, ($parcel$interopDefault($gvH4Z$react))).createElement($6d3a394e4e7927ef$export$a2200b96afd16271.Provider, {
        value: contextValue
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($gvH4Z$react))).createElement((0, $271711dcf3cbfb6a$exports.ClearPressResponder), null, contents));
    return /*#__PURE__*/ (0, ($parcel$interopDefault($gvH4Z$reactdom))).createPortal(contents, portalContainer);
}
function $6d3a394e4e7927ef$export$14c98a7594375490() {
    let ctx = (0, $gvH4Z$react.useContext)($6d3a394e4e7927ef$export$a2200b96afd16271);
    let setContain = ctx?.setContain;
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        setContain?.(true);
    }, [
        setContain
    ]);
}


//# sourceMappingURL=Overlay.cjs.map
