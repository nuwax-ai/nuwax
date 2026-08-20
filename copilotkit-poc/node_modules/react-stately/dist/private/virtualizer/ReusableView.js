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
 */ let $c7620442287ad52a$var$KEY = 0;
class $c7620442287ad52a$export$1a5223887c560441 {
    /**
   * Prepares the view for reuse. Called just before the view is removed from the DOM.
   */ prepareForReuse() {
        this.content = null;
        this.rendered = null;
        this.layoutInfo = null;
    }
    getReusableView(reuseType) {
        // Reusable view queue should be FIFO so that DOM order remains consistent during scrolling.
        // For example, cells within a row should remain in the same order even if the row changes contents.
        // The cells within a row are removed from their parent in order. If the row is reused, the cells
        // should be reused in the new row in the same order they were before.
        let reusable = this.reusableViews.get(reuseType);
        let view = reusable && reusable.length > 0 ? reusable.shift() : new $c7620442287ad52a$export$7a41b6f219e61634(this.virtualizer, this, reuseType);
        return view;
    }
    reuseChild(child) {
        child.prepareForReuse();
        let reusable = this.reusableViews.get(child.viewType);
        if (!reusable) {
            reusable = [];
            this.reusableViews.set(child.viewType, reusable);
        }
        reusable.push(child);
    }
    constructor(virtualizer, viewType){
        this.virtualizer = virtualizer;
        this.key = ++$c7620442287ad52a$var$KEY;
        this.viewType = viewType;
        this.children = new Set();
        this.reusableViews = new Map();
        this.layoutInfo = null;
        this.content = null;
        this.rendered = null;
    }
}
class $c7620442287ad52a$export$e21886a4eef6b29a extends $c7620442287ad52a$export$1a5223887c560441 {
    constructor(virtualizer){
        super(virtualizer, 'root');
    }
}
class $c7620442287ad52a$export$7a41b6f219e61634 extends $c7620442287ad52a$export$1a5223887c560441 {
    constructor(virtualizer, parent, viewType){
        super(virtualizer, viewType);
        this.parent = parent;
    }
}


export {$c7620442287ad52a$export$1a5223887c560441 as ReusableView, $c7620442287ad52a$export$7a41b6f219e61634 as ChildView, $c7620442287ad52a$export$e21886a4eef6b29a as RootView};
//# sourceMappingURL=ReusableView.js.map
