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
 */ const $cf56c58f505db99a$export$552312adfd451dab = new WeakMap();
function $cf56c58f505db99a$var$normalizeKey(key) {
    if (typeof key === 'string') return key.replace(/\s*/g, '');
    return '' + key;
}
function $cf56c58f505db99a$export$37cd4213f2ad742e(state, columnKey) {
    let gridId = $cf56c58f505db99a$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error('Unknown grid');
    return `${gridId}-${$cf56c58f505db99a$var$normalizeKey(columnKey)}`;
}
function $cf56c58f505db99a$export$19baff3266315d44(state, rowKey, columnKey) {
    let gridId = $cf56c58f505db99a$export$552312adfd451dab.get(state);
    if (!gridId) throw new Error('Unknown grid');
    return `${gridId}-${$cf56c58f505db99a$var$normalizeKey(rowKey)}-${$cf56c58f505db99a$var$normalizeKey(columnKey)}`;
}
function $cf56c58f505db99a$export$85069b70317f543(state, rowKey) {
    // A row is labelled by it's row headers.
    return [
        ...state.collection.rowHeaderColumnKeys
    ].map((columnKey)=>$cf56c58f505db99a$export$19baff3266315d44(state, rowKey, columnKey)).join(' ');
}


export {$cf56c58f505db99a$export$552312adfd451dab as gridIds, $cf56c58f505db99a$export$37cd4213f2ad742e as getColumnHeaderId, $cf56c58f505db99a$export$19baff3266315d44 as getCellId, $cf56c58f505db99a$export$85069b70317f543 as getRowLabelledBy};
//# sourceMappingURL=utils.mjs.map
