import {useRef as $5JSrC$useRef, useCallback as $5JSrC$useCallback, useMemo as $5JSrC$useMemo} from "react";

/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $5f169cf7bc5a96a9$export$4338b53315abf666(ref) {
    const objRef = (0, $5JSrC$useRef)(null);
    const cleanupRef = (0, $5JSrC$useRef)(undefined);
    const refEffect = (0, $5JSrC$useCallback)((instance)=>{
        if (typeof ref === 'function') {
            const refCallback = ref;
            const refCleanup = refCallback(instance);
            return ()=>{
                if (typeof refCleanup === 'function') refCleanup();
                else refCallback(null);
            };
        } else if (ref) {
            ref.current = instance;
            return ()=>{
                ref.current = null;
            };
        }
    }, [
        ref
    ]);
    return (0, $5JSrC$useMemo)(()=>({
            get current () {
                return objRef.current;
            },
            set current (value){
                objRef.current = value;
                if (cleanupRef.current) {
                    cleanupRef.current();
                    cleanupRef.current = undefined;
                }
                if (value != null) cleanupRef.current = refEffect(value);
            }
        }), [
        refEffect
    ]);
}


export {$5f169cf7bc5a96a9$export$4338b53315abf666 as useObjectRef};
//# sourceMappingURL=useObjectRef.js.map
