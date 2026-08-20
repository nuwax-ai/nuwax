var $90c404755d945e7c$exports = require("./Color.cjs");
var $AqGf9$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useColor", function () { return $4e0e76ad3205925c$export$5aadd9c0606af5c2; });
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

function $4e0e76ad3205925c$export$5aadd9c0606af5c2(value) {
    return (0, $AqGf9$react.useMemo)(()=>{
        if (typeof value === 'string') try {
            return (0, $90c404755d945e7c$exports.parseColor)(value);
        } catch  {
            return undefined;
        }
        return value;
    }, [
        value
    ]);
}


//# sourceMappingURL=useColor.cjs.map
