var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $e233ff3a3a386c78$exports = require("./context.cjs");
var $d3019c77b88650e9$exports = require("../utils/useObjectRef.cjs");
var $4a79f3400029329d$exports = require("../utils/useSyncRef.cjs");
var $19M6Q$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "PressResponder", function () { return $271711dcf3cbfb6a$export$3351871ee4b288b8; });
$parcel$export(module.exports, "ClearPressResponder", function () { return $271711dcf3cbfb6a$export$cf75428e0b9ed1ea; });
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




const $271711dcf3cbfb6a$export$3351871ee4b288b8 = /*#__PURE__*/ (0, ($parcel$interopDefault($19M6Q$react))).forwardRef(({ children: children, ...props }, ref)=>{
    let isRegistered = (0, $19M6Q$react.useRef)(false);
    let prevContext = (0, $19M6Q$react.useContext)((0, $e233ff3a3a386c78$exports.PressResponderContext));
    let context = (0, $89b39774f3b79dbb$exports.mergeProps)(prevContext || {}, {
        ...props,
        register () {
            isRegistered.current = true;
            if (prevContext) prevContext.register();
        }
    });
    context.ref = (0, $d3019c77b88650e9$exports.useObjectRef)(ref || prevContext?.ref);
    (0, $4a79f3400029329d$exports.useSyncRef)(prevContext, context.ref);
    (0, $19M6Q$react.useEffect)(()=>{
        if (!isRegistered.current) {
            if (process.env.NODE_ENV !== 'production') console.warn("A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.");
            isRegistered.current = true; // only warn once in strict mode.
        }
    }, []);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($19M6Q$react))).createElement((0, $e233ff3a3a386c78$exports.PressResponderContext).Provider, {
        value: context
    }, children);
});
function $271711dcf3cbfb6a$export$cf75428e0b9ed1ea({ children: children }) {
    let context = (0, $19M6Q$react.useMemo)(()=>({
            register: ()=>{}
        }), []);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($19M6Q$react))).createElement((0, $e233ff3a3a386c78$exports.PressResponderContext).Provider, {
        value: context
    }, children);
}


//# sourceMappingURL=PressResponder.cjs.map
