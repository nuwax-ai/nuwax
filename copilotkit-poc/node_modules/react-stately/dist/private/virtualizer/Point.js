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
 */ class $1bbfd9c42d9344e6$export$baf26146a414f24a {
    /**
   * Returns a copy of this point.
   */ copy() {
        return new $1bbfd9c42d9344e6$export$baf26146a414f24a(this.x, this.y);
    }
    /**
   * Checks if two points are equal.
   */ equals(point) {
        return this.x === point.x && this.y === point.y;
    }
    /**
   * Returns true if this point is the origin.
   */ isOrigin() {
        return this.x === 0 && this.y === 0;
    }
    constructor(x = 0, y = 0){
        this.x = x;
        this.y = y;
    }
}


export {$1bbfd9c42d9344e6$export$baf26146a414f24a as Point};
//# sourceMappingURL=Point.js.map
