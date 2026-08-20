
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "listMap", function () { return $daad9bac4699131f$export$5b9bb410392e3991; });
$parcel$export(module.exports, "getRowId", function () { return $daad9bac4699131f$export$f45c25170b9a99c2; });
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
 */ const $daad9bac4699131f$export$5b9bb410392e3991 = new WeakMap();
function $daad9bac4699131f$export$f45c25170b9a99c2(state, key) {
    let { id: id } = $daad9bac4699131f$export$5b9bb410392e3991.get(state) ?? {};
    if (!id) throw new Error('Unknown list');
    return `${id}-${$daad9bac4699131f$export$e0c709538cb8ae18(key)}`;
}
function $daad9bac4699131f$export$e0c709538cb8ae18(key) {
    if (typeof key === 'string') return key.replace(/\s*/g, '');
    return '' + key;
}


//# sourceMappingURL=utils.cjs.map
