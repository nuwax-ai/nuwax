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
 */ class $dcdbc700dd92e06f$export$7e0eeb9da702a085 {
    /**
   * Returns a copy of the LayoutInfo.
   */ copy() {
        let res = new $dcdbc700dd92e06f$export$7e0eeb9da702a085(this.type, this.key, this.rect.copy());
        res.estimatedSize = this.estimatedSize;
        res.opacity = this.opacity;
        res.transform = this.transform;
        res.parentKey = this.parentKey;
        res.content = this.content;
        res.isSticky = this.isSticky;
        res.zIndex = this.zIndex;
        res.allowOverflow = this.allowOverflow;
        return res;
    }
    /**
   * @param type The type of element represented by this LayoutInfo. Should match the `type` of the
   *   corresponding collection node.
   * @param key A unique key for this LayoutInfo. Should match the `key` of the corresponding
   *   collection node.
   * @param rect The rectangle describing the size and position of this element.
   */ constructor(type, key, rect){
        this.type = type;
        this.key = key;
        this.parentKey = null;
        this.content = null;
        this.rect = rect;
        this.estimatedSize = false;
        this.isSticky = false;
        this.opacity = 1;
        this.transform = null;
        this.zIndex = 0;
        this.allowOverflow = false;
    }
}


export {$dcdbc700dd92e06f$export$7e0eeb9da702a085 as LayoutInfo};
//# sourceMappingURL=LayoutInfo.js.map
