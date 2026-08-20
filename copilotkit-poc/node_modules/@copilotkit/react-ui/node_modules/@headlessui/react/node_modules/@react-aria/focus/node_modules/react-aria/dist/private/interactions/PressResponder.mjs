import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {PressResponderContext as $24f9a20f226ad820$export$5165eccb35aaadb5} from "./context.mjs";
import {useObjectRef as $03e8ab2d84d7657a$export$4338b53315abf666} from "../utils/useObjectRef.mjs";
import {useSyncRef as $b7115c395c64f7b5$export$4debdb1a3f0fa79e} from "../utils/useSyncRef.mjs";
import $iXgbh$react, {useRef as $iXgbh$useRef, useContext as $iXgbh$useContext, useEffect as $iXgbh$useEffect, useMemo as $iXgbh$useMemo} from "react";

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




const $0d47b37c475c5231$export$3351871ee4b288b8 = /*#__PURE__*/ (0, $iXgbh$react).forwardRef(({ children: children, ...props }, ref)=>{
    let isRegistered = (0, $iXgbh$useRef)(false);
    let prevContext = (0, $iXgbh$useContext)((0, $24f9a20f226ad820$export$5165eccb35aaadb5));
    let context = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(prevContext || {}, {
        ...props,
        register () {
            isRegistered.current = true;
            if (prevContext) prevContext.register();
        }
    });
    context.ref = (0, $03e8ab2d84d7657a$export$4338b53315abf666)(ref || prevContext?.ref);
    (0, $b7115c395c64f7b5$export$4debdb1a3f0fa79e)(prevContext, context.ref);
    (0, $iXgbh$useEffect)(()=>{
        if (!isRegistered.current) {
            if (process.env.NODE_ENV !== 'production') console.warn("A PressResponder was rendered without a pressable child. Either call the usePress hook, or wrap your DOM node with <Pressable> component.");
            isRegistered.current = true; // only warn once in strict mode.
        }
    }, []);
    return /*#__PURE__*/ (0, $iXgbh$react).createElement((0, $24f9a20f226ad820$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
});
function $0d47b37c475c5231$export$cf75428e0b9ed1ea({ children: children }) {
    let context = (0, $iXgbh$useMemo)(()=>({
            register: ()=>{}
        }), []);
    return /*#__PURE__*/ (0, $iXgbh$react).createElement((0, $24f9a20f226ad820$export$5165eccb35aaadb5).Provider, {
        value: context
    }, children);
}


export {$0d47b37c475c5231$export$3351871ee4b288b8 as PressResponder, $0d47b37c475c5231$export$cf75428e0b9ed1ea as ClearPressResponder};
//# sourceMappingURL=PressResponder.mjs.map
