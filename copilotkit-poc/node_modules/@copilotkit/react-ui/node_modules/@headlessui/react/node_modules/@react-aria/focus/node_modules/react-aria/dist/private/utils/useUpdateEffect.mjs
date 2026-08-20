import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "./useEffectEvent.mjs";
import {useRef as $iuQV4$useRef, useEffect as $iuQV4$useEffect} from "react";

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

function $3c71b1595a147f24$export$496315a1608d9602(cb, dependencies) {
    const isInitialMount = (0, $iuQV4$useRef)(true);
    const lastDeps = (0, $iuQV4$useRef)(null);
    let cbEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(cb);
    (0, $iuQV4$useEffect)(()=>{
        isInitialMount.current = true;
        return ()=>{
            isInitialMount.current = false;
        };
    }, []);
    (0, $iuQV4$useEffect)(()=>{
        let prevDeps = lastDeps.current;
        if (isInitialMount.current) isInitialMount.current = false;
        else if (!prevDeps || dependencies.some((dep, i)=>!Object.is(dep, prevDeps[i]))) cbEvent();
        lastDeps.current = dependencies;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
}


export {$3c71b1595a147f24$export$496315a1608d9602 as useUpdateEffect};
//# sourceMappingURL=useUpdateEffect.mjs.map
