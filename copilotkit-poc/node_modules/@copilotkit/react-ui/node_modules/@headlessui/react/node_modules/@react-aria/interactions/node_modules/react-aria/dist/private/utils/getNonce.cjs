var $49582955cc364b1c$exports = require("./domHelpers.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "getNonce", function () { return $a9ae3cc70c0e2090$export$2b85b721e524d74b; });
/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
function $a9ae3cc70c0e2090$var$getWebpackNonce(doc) {
    let ownerWindow = doc?.defaultView;
    return ownerWindow?.__webpack_nonce__ || globalThis['__webpack_nonce__'] || undefined;
}
let $a9ae3cc70c0e2090$var$nonceCache = new WeakMap();
function $a9ae3cc70c0e2090$export$88b319273f3705b4() {
    $a9ae3cc70c0e2090$var$nonceCache = new WeakMap();
}
function $a9ae3cc70c0e2090$export$2b85b721e524d74b(doc) {
    let d = doc ?? (typeof document !== 'undefined' ? document : undefined);
    if (!d) return $a9ae3cc70c0e2090$var$getWebpackNonce(d);
    if ($a9ae3cc70c0e2090$var$nonceCache.has(d)) return $a9ae3cc70c0e2090$var$nonceCache.get(d);
    let meta = d.querySelector('meta[property="csp-nonce"]');
    let nonce = meta && meta instanceof (0, $49582955cc364b1c$exports.getOwnerWindow)(meta).HTMLMetaElement && (meta.nonce || meta.content) || $a9ae3cc70c0e2090$var$getWebpackNonce(d) || undefined;
    if (nonce !== undefined) $a9ae3cc70c0e2090$var$nonceCache.set(d, nonce);
    return nonce;
}


//# sourceMappingURL=getNonce.cjs.map
