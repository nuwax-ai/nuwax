
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "tabsIds", function () { return $fe3ef331ec3a03dd$export$c5f62239608282b6; });
$parcel$export(module.exports, "generateId", function () { return $fe3ef331ec3a03dd$export$567fc7097e064344; });
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
 */ const $fe3ef331ec3a03dd$export$c5f62239608282b6 = new WeakMap();
function $fe3ef331ec3a03dd$export$567fc7097e064344(state, key, role) {
    if (!state) // this case should only happen in the first render before the tabs are registered
    return '';
    if (typeof key === 'string') key = key.replace(/\s+/g, '');
    let baseId = $fe3ef331ec3a03dd$export$c5f62239608282b6.get(state);
    if (process.env.NODE_ENV !== 'production' && !baseId) console.error('There is no tab id, please check if you have rendered the tab panel before the tab list.');
    return `${baseId}-${role}-${key}`;
}


//# sourceMappingURL=utils.cjs.map
