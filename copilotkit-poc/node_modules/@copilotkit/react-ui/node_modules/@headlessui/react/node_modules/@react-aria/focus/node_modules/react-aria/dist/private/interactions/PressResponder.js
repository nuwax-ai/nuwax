import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {PressResponderContext as $dacd55d881558a20$export$5165eccb35aaadb5} from "./context.js";
import {useObjectRef as $5f169cf7bc5a96a9$export$4338b53315abf666} from "../utils/useObjectRef.js";
import {useSyncRef as $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.js";
import $60etM$react, {useRef as $60etM$useRef, useContext as $60etM$useContext, useEffect as $60etM$useEffect, useMemo as $60etM$useMemo} from "react";

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




const $5d4e6730a3d5484c$export$3351871ee4b288b8 = /*#__PURE__*/ (0, $60etM$react).forwardRef(({ children: children, ...props }, ref)=>{
    let isRegistered = (0, $60etM$useRef)(false);
    let prevContext = (0, $60etM$useContext)((0, $dacd55d881558a20$export$5165eccb35aaadb5));
    let context = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(prevContext || {}, {
        ...props,
        register () {
            isRegistered.current = true;
            if (prevContext) prevContext.register();
        }
    });
    context.ref = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)(ref || (prevContext === null || prevContext === void 0 ? void 0 : prevContext.ref));
    (0, $6a8f54bd475a2c7b$export$4debdb1a3f0fa79e)(prevContext, context.ref);
    (0, $60etM$useEffect)(()=>{
        if (!isRegistered.current) {
            if (process.env.NODE_ENV !== 'production') console.warn("A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.");
            isRegistered.current = true; // only warn once in strict mode.
        }
    }, []);
    return /*#__PURE__*/ (0, $60etM$react).createElement((0, $dacd55d881558a20$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
});
function $5d4e6730a3d5484c$export$cf75428e0b9ed1ea({ children: children }) {
    let context = (0, $60etM$useMemo)(()=>({
            register: ()=>{}
        }), []);
    return /*#__PURE__*/ (0, $60etM$react).createElement((0, $dacd55d881558a20$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
}


export {$5d4e6730a3d5484c$export$3351871ee4b288b8 as PressResponder, $5d4e6730a3d5484c$export$cf75428e0b9ed1ea as ClearPressResponder};
//# sourceMappingURL=PressResponder.js.map
