import {Point as $1bbfd9c42d9344e6$export$baf26146a414f24a} from "./Point.js";
import {Rect as $546350db2c358941$export$c79fc6492f3af13d} from "./Rect.js";

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
 */ 

class $44cbaca532f3db86$export$4455ee6afb38dcbb {
    setVisibleRect(rect) {
        let time = performance.now() - this.startTime;
        if (time < 500) {
            if (rect.x !== this.visibleRect.x && time > 0) this.velocity.x = (rect.x - this.visibleRect.x) / time;
            if (rect.y !== this.visibleRect.y && time > 0) this.velocity.y = (rect.y - this.visibleRect.y) / time;
        }
        this.startTime = performance.now();
        this.visibleRect = rect;
    }
    getOverscannedRect() {
        let overscanned = this.visibleRect.copy();
        let overscanY = this.visibleRect.height / 3;
        overscanned.height += overscanY;
        if (this.velocity.y < 0) overscanned.y -= overscanY;
        let overscanX = this.visibleRect.width / 3;
        overscanned.width += overscanX;
        if (this.velocity.x < 0) overscanned.x -= overscanX;
        return overscanned;
    }
    constructor(){
        this.startTime = 0;
        this.velocity = new (0, $1bbfd9c42d9344e6$export$baf26146a414f24a)(0, 0);
        this.visibleRect = new (0, $546350db2c358941$export$c79fc6492f3af13d)();
    }
}


export {$44cbaca532f3db86$export$4455ee6afb38dcbb as OverscanManager};
//# sourceMappingURL=OverscanManager.js.map
