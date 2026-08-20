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
 */ const $8e9d2fae0ecb9001$var$DOMPropNames = new Set([
    'id'
]);
const $8e9d2fae0ecb9001$var$labelablePropNames = new Set([
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'aria-details'
]);
// See LinkDOMProps in dom.d.ts.
const $8e9d2fae0ecb9001$var$linkPropNames = new Set([
    'href',
    'hrefLang',
    'target',
    'rel',
    'download',
    'ping',
    'referrerPolicy'
]);
const $8e9d2fae0ecb9001$var$globalAttrs = new Set([
    'dir',
    'lang',
    'hidden',
    'inert',
    'translate'
]);
const $8e9d2fae0ecb9001$var$globalEvents = new Set([
    'onClick',
    'onAuxClick',
    'onContextMenu',
    'onDoubleClick',
    'onMouseDown',
    'onMouseEnter',
    'onMouseLeave',
    'onMouseMove',
    'onMouseOut',
    'onMouseOver',
    'onMouseUp',
    'onTouchCancel',
    'onTouchEnd',
    'onTouchMove',
    'onTouchStart',
    'onPointerDown',
    'onPointerMove',
    'onPointerUp',
    'onPointerCancel',
    'onPointerEnter',
    'onPointerLeave',
    'onPointerOver',
    'onPointerOut',
    'onGotPointerCapture',
    'onLostPointerCapture',
    'onScroll',
    'onWheel',
    'onAnimationStart',
    'onAnimationEnd',
    'onAnimationIteration',
    'onTransitionCancel',
    'onTransitionEnd',
    'onTransitionRun',
    'onTransitionStart'
]);
const $8e9d2fae0ecb9001$var$propRe = /^(data-.*)$/;
function $8e9d2fae0ecb9001$export$457c3d6518dd4c6f(props, opts = {}) {
    let { labelable: labelable, isLink: isLink, global: global, events: events = global, propNames: propNames } = opts;
    let filteredProps = {};
    for(const prop in props)if (Object.prototype.hasOwnProperty.call(props, prop) && ($8e9d2fae0ecb9001$var$DOMPropNames.has(prop) || labelable && $8e9d2fae0ecb9001$var$labelablePropNames.has(prop) || isLink && $8e9d2fae0ecb9001$var$linkPropNames.has(prop) || global && $8e9d2fae0ecb9001$var$globalAttrs.has(prop) || events && ($8e9d2fae0ecb9001$var$globalEvents.has(prop) || prop.endsWith('Capture') && $8e9d2fae0ecb9001$var$globalEvents.has(prop.slice(0, -7))) || propNames?.has(prop) || $8e9d2fae0ecb9001$var$propRe.test(prop))) filteredProps[prop] = props[prop];
    return filteredProps;
}


export {$8e9d2fae0ecb9001$export$457c3d6518dd4c6f as filterDOMProps};
//# sourceMappingURL=filterDOMProps.mjs.map
