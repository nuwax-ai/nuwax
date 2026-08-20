import {createShadowTreeWalker as $a457c47c6a37ffc5$export$4d0f8be8b12a7ef6} from "../utils/shadowdom/ShadowTreeWalker.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac, getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {shadowDOM as $han3A$shadowDOM} from "react-stately/private/flags/flags";

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



const $20aa6983aa303ce6$var$supportsInert = typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
function $20aa6983aa303ce6$var$isAlwaysVisibleNode(node) {
    return node.dataset.liveAnnouncer === 'true' || node.dataset.reactAriaTopLayer !== undefined;
}
// Keeps a ref count of all hidden elements. Added to when hiding an element, and
// subtracted from when showing it again. When it reaches zero, aria-hidden is removed.
let $20aa6983aa303ce6$var$refCountMap = new WeakMap();
let $20aa6983aa303ce6$var$observerStack = [];
function $20aa6983aa303ce6$export$1c3ebcada18427bf(targets, options) {
    let windowObj = (0, $cc3c3666b64debad$export$f21a1ffae260145a)(targets === null || targets === void 0 ? void 0 : targets[0]);
    let opts = options instanceof windowObj.Element ? {
        root: options
    } : options;
    var _opts_root;
    let root = (_opts_root = opts === null || opts === void 0 ? void 0 : opts.root) !== null && _opts_root !== void 0 ? _opts_root : document.body;
    let shouldUseInert = (opts === null || opts === void 0 ? void 0 : opts.shouldUseInert) && $20aa6983aa303ce6$var$supportsInert;
    let visibleNodes = new Set(targets);
    let hiddenNodes = new Set();
    let getHidden = (element)=>{
        return shouldUseInert && element instanceof windowObj.HTMLElement ? element.inert : element.getAttribute('aria-hidden') === 'true';
    };
    let setHidden = (element, hidden)=>{
        if (shouldUseInert && element instanceof windowObj.HTMLElement) element.inert = hidden;
        else if (hidden) element.setAttribute('aria-hidden', 'true');
        else {
            element.removeAttribute('aria-hidden');
            if (element instanceof windowObj.HTMLElement) // We only ever call setHidden with hidden = false when the nodeCount is 1 aka
            // we are trying to make the element visible to screen readers again, so remove inert as well
            element.inert = false;
        }
    };
    let shadowRootsToWatch = new Set();
    if ((0, $han3A$shadowDOM)()) // find all shadow roots that are ancestors of the targets
    // traverse upwards until the root is reached
    for (let target of targets){
        let node = target;
        while(node && node !== root){
            let root = node.getRootNode();
            if ('shadowRoot' in root) shadowRootsToWatch.add(root.shadowRoot);
            node = root.parentNode;
        }
    }
    let walk = (root)=>{
        // Keep live announcer and top layer elements (e.g. toasts) visible.
        for (let element of root.querySelectorAll('[data-live-announcer], [data-react-aria-top-layer]'))visibleNodes.add(element);
        let acceptNode = (node)=>{
            // Skip this node and its children if it is one of the target nodes, or a live announcer.
            // Also skip children of already hidden nodes, as aria-hidden is recursive. An exception is
            // made for elements with role="row" since VoiceOver on iOS has issues hiding elements with role="row".
            // For that case we want to hide the cells inside as well (https://bugs.webkit.org/show_bug.cgi?id=222623).
            if (hiddenNodes.has(node) || visibleNodes.has(node) || node.parentElement && hiddenNodes.has(node.parentElement) && node.parentElement.getAttribute('role') !== 'row') return NodeFilter.FILTER_REJECT;
            // Skip this node but continue to children if one of the targets is inside the node.
            for (let target of visibleNodes){
                if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(node, target)) return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        };
        let walker = (0, $a457c47c6a37ffc5$export$4d0f8be8b12a7ef6)((0, $cc3c3666b64debad$export$b204af158042fbac)(root), root, NodeFilter.SHOW_ELEMENT, {
            acceptNode: acceptNode
        });
        // TreeWalker does not include the root.
        let acceptRoot = acceptNode(root);
        if (acceptRoot === NodeFilter.FILTER_ACCEPT) hide(root);
        if (acceptRoot !== NodeFilter.FILTER_REJECT) {
            let node = walker.nextNode();
            while(node != null){
                hide(node);
                node = walker.nextNode();
            }
        }
    };
    let hide = (node)=>{
        var _refCountMap_get;
        let refCount = (_refCountMap_get = $20aa6983aa303ce6$var$refCountMap.get(node)) !== null && _refCountMap_get !== void 0 ? _refCountMap_get : 0;
        // If already aria-hidden, and the ref count is zero, then this element
        // was already hidden and there's nothing for us to do.
        if (getHidden(node) && refCount === 0) return;
        if (refCount === 0) setHidden(node, true);
        hiddenNodes.add(node);
        $20aa6983aa303ce6$var$refCountMap.set(node, refCount + 1);
    };
    // If there is already a MutationObserver listening from a previous call,
    // disconnect it so the new on takes over.
    if ($20aa6983aa303ce6$var$observerStack.length) $20aa6983aa303ce6$var$observerStack[$20aa6983aa303ce6$var$observerStack.length - 1].disconnect();
    walk(root);
    let observer = new MutationObserver((changes)=>{
        for (let change of changes){
            if (change.type !== 'childList') continue;
            // If the parent element of the added nodes is not within one of the targets,
            // and not already inside a hidden node, hide all of the new children.
            if (change.target.isConnected && ![
                ...visibleNodes,
                ...hiddenNodes
            ].some((node)=>(0, $d8ac7ed472840322$export$4282f70798064fe0)(node, change.target))) for (let node of change.addedNodes){
                if ((node instanceof HTMLElement || node instanceof SVGElement) && $20aa6983aa303ce6$var$isAlwaysVisibleNode(node)) visibleNodes.add(node);
                else if (node instanceof Element) walk(node);
            }
            if ((0, $han3A$shadowDOM)()) {
                // if any of the observed shadow roots were removed, stop observing them
                for (let shadowRoot of shadowRootsToWatch)if (!shadowRoot.isConnected) {
                    observer.disconnect();
                    break;
                }
            }
        }
    });
    observer.observe(root, {
        childList: true,
        subtree: true
    });
    let shadowObservers = new Set();
    if ((0, $han3A$shadowDOM)()) for (let shadowRoot of shadowRootsToWatch){
        // Disconnect single target instead of all https://github.com/whatwg/dom/issues/126
        let shadowObserver = new MutationObserver((changes)=>{
            for (let change of changes){
                if (change.type !== 'childList') continue;
                // If the parent element of the added nodes is not within one of the targets,
                // and not already inside a hidden node, hide all of the new children.
                if (change.target.isConnected && ![
                    ...visibleNodes,
                    ...hiddenNodes
                ].some((node)=>(0, $d8ac7ed472840322$export$4282f70798064fe0)(node, change.target))) for (let node of change.addedNodes){
                    if ((node instanceof HTMLElement || node instanceof SVGElement) && $20aa6983aa303ce6$var$isAlwaysVisibleNode(node)) visibleNodes.add(node);
                    else if (node instanceof Element) walk(node);
                }
                if ((0, $han3A$shadowDOM)()) {
                    // if any of the observed shadow roots were removed, stop observing them
                    for (let shadowRoot of shadowRootsToWatch)if (!shadowRoot.isConnected) {
                        observer.disconnect();
                        break;
                    }
                }
            }
        });
        shadowObserver.observe(shadowRoot, {
            childList: true,
            subtree: true
        });
        shadowObservers.add(shadowObserver);
    }
    let observerWrapper = {
        visibleNodes: visibleNodes,
        hiddenNodes: hiddenNodes,
        observe () {
            observer.observe(root, {
                childList: true,
                subtree: true
            });
        },
        disconnect () {
            observer.disconnect();
        }
    };
    $20aa6983aa303ce6$var$observerStack.push(observerWrapper);
    return ()=>{
        observer.disconnect();
        if ((0, $han3A$shadowDOM)()) for (let shadowObserver of shadowObservers)shadowObserver.disconnect();
        for (let node of hiddenNodes){
            let count = $20aa6983aa303ce6$var$refCountMap.get(node);
            if (count == null) continue;
            if (count === 1) {
                setHidden(node, false);
                $20aa6983aa303ce6$var$refCountMap.delete(node);
            } else $20aa6983aa303ce6$var$refCountMap.set(node, count - 1);
        }
        // Remove this observer from the stack, and start the previous one.
        if (observerWrapper === $20aa6983aa303ce6$var$observerStack[$20aa6983aa303ce6$var$observerStack.length - 1]) {
            $20aa6983aa303ce6$var$observerStack.pop();
            if ($20aa6983aa303ce6$var$observerStack.length) $20aa6983aa303ce6$var$observerStack[$20aa6983aa303ce6$var$observerStack.length - 1].observe();
        } else $20aa6983aa303ce6$var$observerStack.splice($20aa6983aa303ce6$var$observerStack.indexOf(observerWrapper), 1);
    };
}
function $20aa6983aa303ce6$export$1020fa7f77e17884(element) {
    let observer = $20aa6983aa303ce6$var$observerStack[$20aa6983aa303ce6$var$observerStack.length - 1];
    if (observer && !observer.visibleNodes.has(element)) {
        observer.visibleNodes.add(element);
        return ()=>{
            observer.visibleNodes.delete(element);
        };
    }
}


export {$20aa6983aa303ce6$export$1c3ebcada18427bf as ariaHideOutside, $20aa6983aa303ce6$export$1020fa7f77e17884 as keepVisible};
//# sourceMappingURL=ariaHideOutside.js.map
