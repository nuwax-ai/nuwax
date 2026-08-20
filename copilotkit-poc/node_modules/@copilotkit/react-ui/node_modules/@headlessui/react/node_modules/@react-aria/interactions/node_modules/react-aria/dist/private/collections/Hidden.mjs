import $iuCOg$react, {createContext as $iuCOg$createContext, useContext as $iuCOg$useContext, forwardRef as $iuCOg$forwardRef} from "react";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 
// React doesn't understand the <template> element, which doesn't have children like a normal element.
// It will throw an error during hydration when it expects the firstChild to contain content rendered
// on the server, when in reality, the browser will have placed this inside the `content` document fragment.
// This monkey patches the firstChild property for our special hidden template elements to work around this error.
// does the same for appendChild/removeChild/insertBefore as per the issue below
// See https://github.com/facebook/react/issues/19932
if (typeof HTMLTemplateElement !== 'undefined') {
    Object.defineProperty(HTMLTemplateElement.prototype, 'firstChild', {
        configurable: true,
        enumerable: true,
        get: function() {
            return this.content.firstChild;
        }
    });
    Object.defineProperty(HTMLTemplateElement.prototype, 'appendChild', {
        configurable: true,
        enumerable: true,
        value: function(node) {
            return this.content.appendChild(node);
        }
    });
    Object.defineProperty(HTMLTemplateElement.prototype, 'removeChild', {
        configurable: true,
        enumerable: true,
        value: function(node) {
            return this.content.removeChild(node);
        }
    });
    Object.defineProperty(HTMLTemplateElement.prototype, 'insertBefore', {
        configurable: true,
        enumerable: true,
        value: function(node, child) {
            return this.content.insertBefore(node, child);
        }
    });
}
const $d7f64c32b702fe2c$export$94b6d0abf7d33e8c = /*#__PURE__*/ (0, $iuCOg$createContext)(false);
function $d7f64c32b702fe2c$export$8dc98ba7eadeaa56(props) {
    let isHidden = (0, $iuCOg$useContext)($d7f64c32b702fe2c$export$94b6d0abf7d33e8c);
    if (isHidden) // Don't hide again if we are already hidden.
    return /*#__PURE__*/ (0, $iuCOg$react).createElement((0, $iuCOg$react).Fragment, null, props.children);
    let children = /*#__PURE__*/ (0, $iuCOg$react).createElement($d7f64c32b702fe2c$export$94b6d0abf7d33e8c.Provider, {
        value: true
    }, props.children);
    // In SSR, portals are not supported by React. Instead, always render into a <template>
    // element, which the browser will never display to the user. In addition, the
    // content is not part of the accessible DOM tree, so it won't affect ids or other accessibility attributes.
    return /*#__PURE__*/ (0, $iuCOg$react).createElement("template", null, children);
}
function $d7f64c32b702fe2c$export$86427a43e3e48ebb(fn) {
    let Wrapper = (props, ref)=>{
        let isHidden = (0, $iuCOg$useContext)($d7f64c32b702fe2c$export$94b6d0abf7d33e8c);
        if (isHidden) return null;
        return fn(props, ref);
    };
    // @ts-ignore - for react dev tools
    Wrapper.displayName = fn.displayName || fn.name;
    return (0, $iuCOg$forwardRef)(Wrapper);
}
function $d7f64c32b702fe2c$export$b5d7cc18bb8d2b59() {
    return (0, $iuCOg$useContext)($d7f64c32b702fe2c$export$94b6d0abf7d33e8c);
}


export {$d7f64c32b702fe2c$export$94b6d0abf7d33e8c as HiddenContext, $d7f64c32b702fe2c$export$8dc98ba7eadeaa56 as Hidden, $d7f64c32b702fe2c$export$86427a43e3e48ebb as createHideableComponent, $d7f64c32b702fe2c$export$b5d7cc18bb8d2b59 as useIsHidden};
//# sourceMappingURL=Hidden.mjs.map
