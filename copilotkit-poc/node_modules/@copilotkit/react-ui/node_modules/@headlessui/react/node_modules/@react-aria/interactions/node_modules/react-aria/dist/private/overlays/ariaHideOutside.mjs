import {createShadowTreeWalker as $654b97e09f2a30c1$export$4d0f8be8b12a7ef6} from "../utils/shadowdom/ShadowTreeWalker.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {shadowDOM as $6UjbS$shadowDOM} from "react-stately/private/flags/flags";

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



const $58196c8d6a1f38fc$var$supportsInert = typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
function $58196c8d6a1f38fc$var$isAlwaysVisibleNode(node) {
    return node.dataset.liveAnnouncer === 'true' || node.dataset.reactAriaTopLayer !== undefined;
}
// Keeps a ref count of all hidden elements. Added to when hiding an element, and
// subtracted from when showing it again. When it reaches zero, aria-hidden is removed.
let $58196c8d6a1f38fc$var$refCountMap = new WeakMap();
let $58196c8d6a1f38fc$var$observerStack = [];
function $58196c8d6a1f38fc$export$1c3ebcada18427bf(targets, options) {
    let windowObj = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(targets?.[0]);
    let opts = options instanceof windowObj.Element ? {
        root: options
    } : options;
    let root = opts?.root ?? document.body;
    let shouldUseInert = opts?.shouldUseInert && $58196c8d6a1f38fc$var$supportsInert;
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
    if ((0, $6UjbS$shadowDOM)()) // find all shadow roots that are ancestors of the targets
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
                if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(node, target)) return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        };
        let walker = (0, $654b97e09f2a30c1$export$4d0f8be8b12a7ef6)((0, $d447af545b77c9f1$export$b204af158042fbac)(root), root, NodeFilter.SHOW_ELEMENT, {
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
        let refCount = $58196c8d6a1f38fc$var$refCountMap.get(node) ?? 0;
        // If already aria-hidden, and the ref count is zero, then this element
        // was already hidden and there's nothing for us to do.
        if (getHidden(node) && refCount === 0) return;
        if (refCount === 0) setHidden(node, true);
        hiddenNodes.add(node);
        $58196c8d6a1f38fc$var$refCountMap.set(node, refCount + 1);
    };
    // If there is already a MutationObserver listening from a previous call,
    // disconnect it so the new on takes over.
    if ($58196c8d6a1f38fc$var$observerStack.length) $58196c8d6a1f38fc$var$observerStack[$58196c8d6a1f38fc$var$observerStack.length - 1].disconnect();
    walk(root);
    let observer = new MutationObserver((changes)=>{
        for (let change of changes){
            if (change.type !== 'childList') continue;
            // If the parent element of the added nodes is not within one of the targets,
            // and not already inside a hidden node, hide all of the new children.
            if (change.target.isConnected && ![
                ...visibleNodes,
                ...hiddenNodes
            ].some((node)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(node, change.target))) for (let node of change.addedNodes){
                if ((node instanceof HTMLElement || node instanceof SVGElement) && $58196c8d6a1f38fc$var$isAlwaysVisibleNode(node)) visibleNodes.add(node);
                else if (node instanceof Element) walk(node);
            }
            if ((0, $6UjbS$shadowDOM)()) {
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
    if ((0, $6UjbS$shadowDOM)()) for (let shadowRoot of shadowRootsToWatch){
        // Disconnect single target instead of all https://github.com/whatwg/dom/issues/126
        let shadowObserver = new MutationObserver((changes)=>{
            for (let change of changes){
                if (change.type !== 'childList') continue;
                // If the parent element of the added nodes is not within one of the targets,
                // and not already inside a hidden node, hide all of the new children.
                if (change.target.isConnected && ![
                    ...visibleNodes,
                    ...hiddenNodes
                ].some((node)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(node, change.target))) for (let node of change.addedNodes){
                    if ((node instanceof HTMLElement || node instanceof SVGElement) && $58196c8d6a1f38fc$var$isAlwaysVisibleNode(node)) visibleNodes.add(node);
                    else if (node instanceof Element) walk(node);
                }
                if ((0, $6UjbS$shadowDOM)()) {
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
    $58196c8d6a1f38fc$var$observerStack.push(observerWrapper);
    return ()=>{
        observer.disconnect();
        if ((0, $6UjbS$shadowDOM)()) for (let shadowObserver of shadowObservers)shadowObserver.disconnect();
        for (let node of hiddenNodes){
            let count = $58196c8d6a1f38fc$var$refCountMap.get(node);
            if (count == null) continue;
            if (count === 1) {
                setHidden(node, false);
                $58196c8d6a1f38fc$var$refCountMap.delete(node);
            } else $58196c8d6a1f38fc$var$refCountMap.set(node, count - 1);
        }
        // Remove this observer from the stack, and start the previous one.
        if (observerWrapper === $58196c8d6a1f38fc$var$observerStack[$58196c8d6a1f38fc$var$observerStack.length - 1]) {
            $58196c8d6a1f38fc$var$observerStack.pop();
            if ($58196c8d6a1f38fc$var$observerStack.length) $58196c8d6a1f38fc$var$observerStack[$58196c8d6a1f38fc$var$observerStack.length - 1].observe();
        } else $58196c8d6a1f38fc$var$observerStack.splice($58196c8d6a1f38fc$var$observerStack.indexOf(observerWrapper), 1);
    };
}
function $58196c8d6a1f38fc$export$1020fa7f77e17884(element) {
    let observer = $58196c8d6a1f38fc$var$observerStack[$58196c8d6a1f38fc$var$observerStack.length - 1];
    if (observer && !observer.visibleNodes.has(element)) {
        observer.visibleNodes.add(element);
        return ()=>{
            observer.visibleNodes.delete(element);
        };
    }
}


export {$58196c8d6a1f38fc$export$1c3ebcada18427bf as ariaHideOutside, $58196c8d6a1f38fc$export$1020fa7f77e17884 as keepVisible};
//# sourceMappingURL=ariaHideOutside.mjs.map
