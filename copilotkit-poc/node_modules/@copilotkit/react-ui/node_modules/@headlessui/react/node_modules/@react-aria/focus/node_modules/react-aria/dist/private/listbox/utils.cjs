
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "listData", function () { return $63bd36c8d873711d$export$3585ede4d035bf14; });
$parcel$export(module.exports, "getItemId", function () { return $63bd36c8d873711d$export$9145995848b05025; });
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
 */ const $63bd36c8d873711d$export$3585ede4d035bf14 = new WeakMap();
function $63bd36c8d873711d$var$normalizeKey(key) {
    if (typeof key === 'string') return key.replace(/\s*/g, '');
    return '' + key;
}
function $63bd36c8d873711d$export$9145995848b05025(state, itemKey) {
    let data = $63bd36c8d873711d$export$3585ede4d035bf14.get(state);
    if (!data) throw new Error('Unknown list');
    return `${data.id}-option-${$63bd36c8d873711d$var$normalizeKey(itemKey)}`;
}


//# sourceMappingURL=utils.cjs.map
