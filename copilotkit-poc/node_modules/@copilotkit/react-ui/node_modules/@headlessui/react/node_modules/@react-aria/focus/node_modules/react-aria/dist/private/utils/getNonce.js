import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "./domHelpers.js";

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
function $fb5d33e131fca75a$var$getWebpackNonce(doc) {
    let ownerWindow = doc === null || doc === void 0 ? void 0 : doc.defaultView;
    return (ownerWindow === null || ownerWindow === void 0 ? void 0 : ownerWindow.__webpack_nonce__) || globalThis['__webpack_nonce__'] || undefined;
}
let $fb5d33e131fca75a$var$nonceCache = new WeakMap();
function $fb5d33e131fca75a$export$88b319273f3705b4() {
    $fb5d33e131fca75a$var$nonceCache = new WeakMap();
}
function $fb5d33e131fca75a$export$2b85b721e524d74b(doc) {
    let d = doc !== null && doc !== void 0 ? doc : typeof document !== 'undefined' ? document : undefined;
    if (!d) return $fb5d33e131fca75a$var$getWebpackNonce(d);
    if ($fb5d33e131fca75a$var$nonceCache.has(d)) return $fb5d33e131fca75a$var$nonceCache.get(d);
    let meta = d.querySelector('meta[property="csp-nonce"]');
    let nonce = meta && meta instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(meta).HTMLMetaElement && (meta.nonce || meta.content) || $fb5d33e131fca75a$var$getWebpackNonce(d) || undefined;
    if (nonce !== undefined) $fb5d33e131fca75a$var$nonceCache.set(d, nonce);
    return nonce;
}


export {$fb5d33e131fca75a$export$88b319273f3705b4 as resetNonceCache, $fb5d33e131fca75a$export$2b85b721e524d74b as getNonce};
//# sourceMappingURL=getNonce.js.map
