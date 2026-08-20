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
 */ const $83ae27ae4c16dc56$export$c5f62239608282b6 = new WeakMap();
function $83ae27ae4c16dc56$export$567fc7097e064344(state, key, role) {
    if (!state) // this case should only happen in the first render before the tabs are registered
    return '';
    if (typeof key === 'string') key = key.replace(/\s+/g, '');
    let baseId = $83ae27ae4c16dc56$export$c5f62239608282b6.get(state);
    if (process.env.NODE_ENV !== 'production' && !baseId) console.error('There is no tab id, please check if you have rendered the tab panel before the tab list.');
    return `${baseId}-${role}-${key}`;
}


export {$83ae27ae4c16dc56$export$c5f62239608282b6 as tabsIds, $83ae27ae4c16dc56$export$567fc7097e064344 as generateId};
//# sourceMappingURL=utils.js.map
