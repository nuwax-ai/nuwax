
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "isSetEqual", function () { return $0ef96a3bce5c0b0e$export$a8d0d0c8d1c5df64; });
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
 */ /** Returns whether two sets are equal. */ function $0ef96a3bce5c0b0e$export$a8d0d0c8d1c5df64(a, b) {
    if (a === b) return true;
    if (a.size !== b.size) return false;
    for (let key of a){
        if (!b.has(key)) return false;
    }
    return true;
}


//# sourceMappingURL=utils.cjs.map
