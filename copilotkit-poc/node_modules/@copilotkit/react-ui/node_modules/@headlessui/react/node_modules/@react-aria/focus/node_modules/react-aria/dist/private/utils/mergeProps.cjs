var $2f95486cfdaa743c$exports = require("./chain.cjs");
var $7ac82d1fee77eb8a$exports = require("./useId.cjs");
var $8b3af019b8cf786c$exports = require("./mergeRefs.cjs");
var $dr9y3$clsx = require("clsx");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "mergeProps", function () { return $89b39774f3b79dbb$export$9d1611c77c2fe928; });
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



function $89b39774f3b79dbb$export$9d1611c77c2fe928(...args) {
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
            key[0] === 'o' && key[1] === 'n' && key.charCodeAt(2) >= /* 'A' */ 65 && key.charCodeAt(2) <= /* 'Z' */ 90) result[key] = (0, $2f95486cfdaa743c$exports.chain)(a, b);
            else if ((key === 'className' || key === 'UNSAFE_className') && typeof a === 'string' && typeof b === 'string') result[key] = (0, ($parcel$interopDefault($dr9y3$clsx)))(a, b);
            else if (key === 'id' && a && b) result.id = (0, $7ac82d1fee77eb8a$exports.mergeIds)(a, b);
            else if (key === 'ref' && a && b) result.ref = (0, $8b3af019b8cf786c$exports.mergeRefs)(a, b);
            else result[key] = b !== undefined ? b : a;
        }
    }
    return result;
}


//# sourceMappingURL=mergeProps.cjs.map
