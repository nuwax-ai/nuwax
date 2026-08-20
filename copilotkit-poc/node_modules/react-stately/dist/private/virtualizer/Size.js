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
 */ class $266cbd2785be3a2c$export$cb6da89c6af1a8ec {
    /**
   * Returns a copy of this size.
   */ copy() {
        return new $266cbd2785be3a2c$export$cb6da89c6af1a8ec(this.width, this.height);
    }
    /**
   * Returns whether this size is equal to another one.
   */ equals(other) {
        return this.width === other.width && this.height === other.height;
    }
    /**
   * The total area of the Size.
   */ get area() {
        return this.width * this.height;
    }
    constructor(width = 0, height = 0){
        this.width = Math.max(width, 0);
        this.height = Math.max(height, 0);
    }
}


export {$266cbd2785be3a2c$export$cb6da89c6af1a8ec as Size};
//# sourceMappingURL=Size.js.map
