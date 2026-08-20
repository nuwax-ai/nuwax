import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "./useLayoutEffect.mjs";
import $emnFQ$react, {useRef as $emnFQ$useRef, useCallback as $emnFQ$useCallback} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

// Use the earliest effect type possible. useInsertionEffect runs during the mutation phase,
// before all layout effects, but is available only in React 18 and later.
const $fe16bffc7a557bf0$var$useEarlyEffect = (0, $emnFQ$react)['useInsertionEffect'] ?? (0, $c4867b2f328c2698$export$e5c5a5f917a5871c);
function $fe16bffc7a557bf0$export$7f54fc3180508a52(fn) {
    const ref = (0, $emnFQ$useRef)(null);
    $fe16bffc7a557bf0$var$useEarlyEffect(()=>{
        ref.current = fn;
    }, [
        fn
    ]);
    // @ts-ignore
    return (0, $emnFQ$useCallback)((...args)=>{
        const f = ref.current;
        return f?.(...args);
    }, []);
}


export {$fe16bffc7a557bf0$export$7f54fc3180508a52 as useEffectEvent};
//# sourceMappingURL=useEffectEvent.mjs.map
