import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "./chain.js";
import {mergeIds as $0292efe68908de6b$export$cd8c9cb68f842629} from "./useId.js";
import {mergeRefs as $d49e67a55e1d0418$export$c9058316764c140e} from "./mergeRefs.js";
import $gy3Ez$clsx from "clsx";

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



function $64c36edd757dfa16$export$9d1611c77c2fe928(...args) {
    // Start with a base clone of the first argument. This is a lot faster than starting
    // with an empty object and adding properties as we go.
    let result = {
        ...args[0]
    };
    for(let i = 1; i < args.length; i++){
        let props = args[i];
        for(let key in props){
            let a = result[key];
            let b = props[key];
            // Chain events
            if (typeof a === 'function' && typeof b === 'function' && // This is a lot faster than a regex.
            key[0] === 'o' && key[1] === 'n' && key.charCodeAt(2) >= /* 'A' */ 65 && key.charCodeAt(2) <= /* 'Z' */ 90) result[key] = (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(a, b);
            else if ((key === 'className' || key === 'UNSAFE_className') && typeof a === 'string' && typeof b === 'string') result[key] = (0, $gy3Ez$clsx)(a, b);
            else if (key === 'id' && a && b) result.id = (0, $0292efe68908de6b$export$cd8c9cb68f842629)(a, b);
            else if (key === 'ref' && a && b) result.ref = (0, $d49e67a55e1d0418$export$c9058316764c140e)(a, b);
            else result[key] = b !== undefined ? b : a;
        }
    }
    return result;
}


export {$64c36edd757dfa16$export$9d1611c77c2fe928 as mergeProps};
//# sourceMappingURL=mergeProps.js.map
