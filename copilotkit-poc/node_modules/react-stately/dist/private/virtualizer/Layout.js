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
 */ class $bcf18cb0a16f75f6$export$c84671f46d6a1ca {
    /**
   * Returns whether the layout should invalidate in response to
   * visible rectangle changes. By default, it only invalidates
   * when the virtualizer's size changes. Return true always
   * to make the layout invalidate while scrolling (e.g. sticky headers).
   */ shouldInvalidate(newRect, oldRect) {
        // By default, invalidate when the size changes
        return newRect.width !== oldRect.width || newRect.height !== oldRect.height;
    }
    /**
   * Returns whether the layout should invalidate when the layout options change.
   * By default it invalidates when the object identity changes. Override this
   * method to optimize layout updates based on specific option changes.
   */ shouldInvalidateLayoutOptions(newOptions, oldOptions) {
        return newOptions !== oldOptions;
    }
    /**
   * This method allows the layout to perform any pre-computation
   * it needs to in order to prepare LayoutInfos for retrieval.
   * Called by the virtualizer before `getVisibleLayoutInfos`
   * or `getLayoutInfo` are called.
   */ update(invalidationContext) {}
    /** @private */ getItemRect(key) {
        var _this_getLayoutInfo;
        var _this_getLayoutInfo_rect;
        return (_this_getLayoutInfo_rect = (_this_getLayoutInfo = this.getLayoutInfo(key)) === null || _this_getLayoutInfo === void 0 ? void 0 : _this_getLayoutInfo.rect) !== null && _this_getLayoutInfo_rect !== void 0 ? _this_getLayoutInfo_rect : null;
    }
    /** @private */ getVisibleRect() {
        return this.virtualizer.visibleRect;
    }
    constructor(){
        /** The Virtualizer the layout is currently attached to. */ this.virtualizer = null;
    }
}


export {$bcf18cb0a16f75f6$export$c84671f46d6a1ca as Layout};
//# sourceMappingURL=Layout.js.map
