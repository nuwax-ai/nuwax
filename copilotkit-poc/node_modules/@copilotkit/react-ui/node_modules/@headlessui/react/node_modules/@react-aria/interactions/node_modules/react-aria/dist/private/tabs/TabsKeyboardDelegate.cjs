
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "TabsKeyboardDelegate", function () { return $32378ba789af91c7$export$15010ca3c1abe90b; });
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
 */ class $32378ba789af91c7$export$15010ca3c1abe90b {
    constructor(collection, direction, orientation, disabledKeys = new Set()){
        this.collection = collection;
        this.flipDirection = direction === 'rtl' && orientation === 'horizontal';
        this.disabledKeys = disabledKeys;
        this.tabDirection = orientation === 'horizontal';
    }
    getKeyLeftOf(key) {
        if (this.flipDirection) return this.getNextKey(key);
        return this.getPreviousKey(key);
    }
    getKeyRightOf(key) {
        if (this.flipDirection) return this.getPreviousKey(key);
        return this.getNextKey(key);
    }
    isDisabled(key) {
        return this.disabledKeys.has(key) || !!this.collection.getItem(key)?.props?.isDisabled;
    }
    getFirstKey() {
        let key = this.collection.getFirstKey();
        if (key != null && this.isDisabled(key)) key = this.getNextKey(key);
        return key;
    }
    getLastKey() {
        let key = this.collection.getLastKey();
        if (key != null && this.isDisabled(key)) key = this.getPreviousKey(key);
        return key;
    }
    getKeyAbove(key) {
        if (this.tabDirection) return null;
        return this.getPreviousKey(key);
    }
    getKeyBelow(key) {
        if (this.tabDirection) return null;
        return this.getNextKey(key);
    }
    getNextKey(startKey) {
        let key = startKey;
        do {
            key = this.collection.getKeyAfter(key);
            if (key == null) key = this.collection.getFirstKey();
        }while (key != null && this.isDisabled(key));
        return key;
    }
    getPreviousKey(startKey) {
        let key = startKey;
        do {
            key = this.collection.getKeyBefore(key);
            if (key == null) key = this.collection.getLastKey();
        }while (key != null && this.isDisabled(key));
        return key;
    }
}


//# sourceMappingURL=TabsKeyboardDelegate.cjs.map
