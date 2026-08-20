import {Point as $b88f793813fc795e$export$baf26146a414f24a} from "./Point.mjs";

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
class $af827553fd3cf456$export$c79fc6492f3af13d {
    constructor(x = 0, y = 0, width = 0, height = 0){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    /**
   * The maximum x-coordinate in the rectangle.
   */ get maxX() {
        return this.x + this.width;
    }
    /**
   * The maximum y-coordinate in the rectangle.
   */ get maxY() {
        return this.y + this.height;
    }
    /**
   * The area of the rectangle.
   */ get area() {
        return this.width * this.height;
    }
    /**
   * The top left corner of the rectangle.
   */ get topLeft() {
        return new (0, $b88f793813fc795e$export$baf26146a414f24a)(this.x, this.y);
    }
    /**
   * The top right corner of the rectangle.
   */ get topRight() {
        return new (0, $b88f793813fc795e$export$baf26146a414f24a)(this.maxX, this.y);
    }
    /**
   * The bottom left corner of the rectangle.
   */ get bottomLeft() {
        return new (0, $b88f793813fc795e$export$baf26146a414f24a)(this.x, this.maxY);
    }
    /**
   * The bottom right corner of the rectangle.
   */ get bottomRight() {
        return new (0, $b88f793813fc795e$export$baf26146a414f24a)(this.maxX, this.maxY);
    }
    /**
   * Returns whether this rectangle intersects another rectangle.
   *
   * @param rect - The rectangle to check.
   */ intersects(rect) {
        let isTestEnv = process.env.NODE_ENV === 'test' && !process.env.VIRT_ON;
        return (isTestEnv || this.area > 0 && rect.area > 0) && this.x <= rect.x + rect.width && rect.x <= this.x + this.width && this.y <= rect.y + rect.height && rect.y <= this.y + this.height;
    }
    /**
   * Returns whether this rectangle fully contains another rectangle.
   *
   * @param rect - The rectangle to check.
   */ containsRect(rect) {
        return this.x <= rect.x && this.y <= rect.y && this.maxX >= rect.maxX && this.maxY >= rect.maxY;
    }
    /**
   * Returns whether the rectangle contains the given point.
   *
   * @param point - The point to check.
   */ containsPoint(point) {
        return this.x <= point.x && this.y <= point.y && this.maxX >= point.x && this.maxY >= point.y;
    }
    /**
   * Returns the first corner of this rectangle (from top to bottom, left to right)
   * that is contained in the given rectangle, or null of the rectangles do not intersect.
   *
   * @param rect - The rectangle to check.
   */ getCornerInRect(rect) {
        for (let key of [
            'topLeft',
            'topRight',
            'bottomLeft',
            'bottomRight'
        ]){
            if (rect.containsPoint(this[key])) return key;
        }
        return null;
    }
    equals(rect) {
        return rect.x === this.x && rect.y === this.y && rect.width === this.width && rect.height === this.height;
    }
    pointEquals(point) {
        return this.x === point.x && this.y === point.y;
    }
    sizeEquals(size) {
        return this.width === size.width && this.height === size.height;
    }
    /**
   * Returns the union of this Rect and another.
   */ union(other) {
        let x = Math.min(this.x, other.x);
        let y = Math.min(this.y, other.y);
        let width = Math.max(this.maxX, other.maxX) - x;
        let height = Math.max(this.maxY, other.maxY) - y;
        return new $af827553fd3cf456$export$c79fc6492f3af13d(x, y, width, height);
    }
    /**
   * Returns the intersection of this Rect with another.
   * If the rectangles do not intersect, an all zero Rect is returned.
   */ intersection(other) {
        if (!this.intersects(other)) return new $af827553fd3cf456$export$c79fc6492f3af13d(0, 0, 0, 0);
        let x = Math.max(this.x, other.x);
        let y = Math.max(this.y, other.y);
        return new $af827553fd3cf456$export$c79fc6492f3af13d(x, y, Math.min(this.maxX, other.maxX) - x, Math.min(this.maxY, other.maxY) - y);
    }
    /**
   * Returns a copy of this rectangle.
   */ copy() {
        return new $af827553fd3cf456$export$c79fc6492f3af13d(this.x, this.y, this.width, this.height);
    }
}


export {$af827553fd3cf456$export$c79fc6492f3af13d as Rect};
//# sourceMappingURL=Rect.mjs.map
