import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "./useEffectEvent.js";
import {useRef as $hV3gJ$useRef, useEffect as $hV3gJ$useEffect} from "react";

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

function $b444858e8a82ccea$export$496315a1608d9602(cb, dependencies) {
    const isInitialMount = (0, $hV3gJ$useRef)(true);
    const lastDeps = (0, $hV3gJ$useRef)(null);
    let cbEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(cb);
    (0, $hV3gJ$useEffect)(()=>{
        isInitialMount.current = true;
        return ()=>{
            isInitialMount.current = false;
        };
    }, []);
    (0, $hV3gJ$useEffect)(()=>{
        let prevDeps = lastDeps.current;
        if (isInitialMount.current) isInitialMount.current = false;
        else if (!prevDeps || dependencies.some((dep, i)=>!Object.is(dep, prevDeps[i]))) cbEvent();
        lastDeps.current = dependencies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}


export {$b444858e8a82ccea$export$496315a1608d9602 as useUpdateEffect};
//# sourceMappingURL=useUpdateEffect.js.map
