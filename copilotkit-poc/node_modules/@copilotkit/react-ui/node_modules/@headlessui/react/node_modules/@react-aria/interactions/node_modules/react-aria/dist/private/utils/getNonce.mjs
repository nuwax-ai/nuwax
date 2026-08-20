import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "./domHelpers.mjs";

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
function $2b2d34ff061957fb$var$getWebpackNonce(doc) {
    let ownerWindow = doc?.defaultView;
    return ownerWindow?.__webpack_nonce__ || globalThis['__webpack_nonce__'] || undefined;
}
let $2b2d34ff061957fb$var$nonceCache = new WeakMap();
function $2b2d34ff061957fb$export$88b319273f3705b4() {
    $2b2d34ff061957fb$var$nonceCache = new WeakMap();
}
function $2b2d34ff061957fb$export$2b85b721e524d74b(doc) {
    let d = doc ?? (typeof document !== 'undefined' ? document : undefined);
    if (!d) return $2b2d34ff061957fb$var$getWebpackNonce(d);
    if ($2b2d34ff061957fb$var$nonceCache.has(d)) return $2b2d34ff061957fb$var$nonceCache.get(d);
    let meta = d.querySelector('meta[property="csp-nonce"]');
    let nonce = meta && meta instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(meta).HTMLMetaElement && (meta.nonce || meta.content) || $2b2d34ff061957fb$var$getWebpackNonce(d) || undefined;
    if (nonce !== undefined) $2b2d34ff061957fb$var$nonceCache.set(d, nonce);
    return nonce;
}


export {$2b2d34ff061957fb$export$88b319273f3705b4 as resetNonceCache, $2b2d34ff061957fb$export$2b85b721e524d74b as getNonce};
//# sourceMappingURL=getNonce.mjs.map
