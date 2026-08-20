var $4ca29ec9516c15bb$exports = require("../utils/shadowdom/ShadowTreeWalker.cjs");
var $4a053a4bf25e52fb$exports = require("../interactions/focusSafely.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $48f566b6becd50da$exports = require("../utils/isFocusable.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $gYMUj$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "FocusScope", function () { return $9fb4ac1cc58342cc$export$20e40289641fbbb6; });
$parcel$export(module.exports, "useFocusManager", function () { return $9fb4ac1cc58342cc$export$10c5169755ce7bd7; });
$parcel$export(module.exports, "getFocusableTreeWalker", function () { return $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa; });
$parcel$export(module.exports, "isElementInChildOfActiveScope", function () { return $9fb4ac1cc58342cc$export$1258395f99bf9cbf; });
$parcel$export(module.exports, "createFocusManager", function () { return $9fb4ac1cc58342cc$export$c5251b9e124bf29; });
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








const $9fb4ac1cc58342cc$var$FocusContext = /*#__PURE__*/ (0, ($parcel$interopDefault($gYMUj$react))).createContext(null);
const $9fb4ac1cc58342cc$var$RESTORE_FOCUS_EVENT = 'react-aria-focus-scope-restore';
let $9fb4ac1cc58342cc$var$activeScope = null;
function $9fb4ac1cc58342cc$export$20e40289641fbbb6(props) {
    let { children: children, contain: contain, restoreFocus: restoreFocus, autoFocus: autoFocus } = props;
    let startRef = (0, $gYMUj$react.useRef)(null);
    let endRef = (0, $gYMUj$react.useRef)(null);
    let scopeRef = (0, $gYMUj$react.useRef)([]);
    let { parentNode: parentNode } = (0, $gYMUj$react.useContext)($9fb4ac1cc58342cc$var$FocusContext) || {};
    // Create a tree node here so we can add children to it even before it is added to the tree.
    let node = (0, $gYMUj$react.useMemo)(()=>new $9fb4ac1cc58342cc$var$TreeNode({
            scopeRef: scopeRef
        }), [
        scopeRef
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        // If a new scope mounts outside the active scope, (e.g. DialogContainer launched from a menu),
        // use the active scope as the parent instead of the parent from context. Layout effects run bottom
        // up, so if the parent is not yet added to the tree, don't do this. Only the outer-most FocusScope
        // that is being added should get the activeScope as its parent.
        let parent = parentNode || $9fb4ac1cc58342cc$export$d06fae2ee68b101e.root;
        if ($9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(parent.scopeRef) && $9fb4ac1cc58342cc$var$activeScope && !$9fb4ac1cc58342cc$var$isAncestorScope($9fb4ac1cc58342cc$var$activeScope, parent.scopeRef)) {
            let activeNode = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode($9fb4ac1cc58342cc$var$activeScope);
            if (activeNode) parent = activeNode;
        }
        // Add the node to the parent, and to the tree.
        parent.addChild(node);
        $9fb4ac1cc58342cc$export$d06fae2ee68b101e.addNode(node);
    }, [
        node,
        parentNode
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        let node = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (node) node.contain = !!contain;
    }, [
        contain
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        // Find all rendered nodes between the sentinels and add them to the scope.
        let node = startRef.current?.nextSibling;
        let nodes = [];
        let stopPropagation = (e)=>e.stopPropagation();
        while(node && node !== endRef.current){
            nodes.push(node);
            // Stop custom restore focus event from propagating to parent focus scopes.
            node.addEventListener($9fb4ac1cc58342cc$var$RESTORE_FOCUS_EVENT, stopPropagation);
            node = node.nextSibling;
        }
        scopeRef.current = nodes;
        return ()=>{
            for (let node of nodes)node.removeEventListener($9fb4ac1cc58342cc$var$RESTORE_FOCUS_EVENT, stopPropagation);
        };
    }, [
        children
    ]);
    $9fb4ac1cc58342cc$var$useActiveScopeTracker(scopeRef, restoreFocus, contain);
    $9fb4ac1cc58342cc$var$useFocusContainment(scopeRef, contain);
    $9fb4ac1cc58342cc$var$useRestoreFocus(scopeRef, restoreFocus, contain);
    $9fb4ac1cc58342cc$var$useAutoFocus(scopeRef, autoFocus);
    // This needs to be an effect so that activeScope is updated after the FocusScope tree is complete.
    // It cannot be a useLayoutEffect because the parent of this node hasn't been attached in the tree yet.
    (0, $gYMUj$react.useEffect)(()=>{
        const activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined));
        let scope = null;
        if ($9fb4ac1cc58342cc$var$isElementInScope(activeElement, scopeRef.current)) {
            // We need to traverse the focusScope tree and find the bottom most scope that
            // contains the active element and set that as the activeScope.
            for (let node of $9fb4ac1cc58342cc$export$d06fae2ee68b101e.traverse())if (node.scopeRef && $9fb4ac1cc58342cc$var$isElementInScope(activeElement, node.scopeRef.current)) scope = node;
            if (scope === $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef)) $9fb4ac1cc58342cc$var$activeScope = scope.scopeRef;
        }
    }, [
        scopeRef
    ]);
    // This layout effect cleanup is so that the tree node is removed synchronously with react before the RAF
    // in useRestoreFocus cleanup runs.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        return ()=>{
            // Scope may have been re-parented.
            let parentScope = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef)?.parent?.scopeRef ?? null;
            if ((scopeRef === $9fb4ac1cc58342cc$var$activeScope || $9fb4ac1cc58342cc$var$isAncestorScope(scopeRef, $9fb4ac1cc58342cc$var$activeScope)) && (!parentScope || $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(parentScope))) $9fb4ac1cc58342cc$var$activeScope = parentScope;
            $9fb4ac1cc58342cc$export$d06fae2ee68b101e.removeTreeNode(scopeRef);
        };
    }, [
        scopeRef
    ]);
    let focusManager = (0, $gYMUj$react.useMemo)(()=>$9fb4ac1cc58342cc$var$createFocusManagerForScope(scopeRef), []);
    let value = (0, $gYMUj$react.useMemo)(()=>({
            focusManager: focusManager,
            parentNode: node
        }), [
        node,
        focusManager
    ]);
    return /*#__PURE__*/ (0, ($parcel$interopDefault($gYMUj$react))).createElement($9fb4ac1cc58342cc$var$FocusContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, ($parcel$interopDefault($gYMUj$react))).createElement("span", {
        "data-focus-scope-start": true,
        hidden: true,
        ref: startRef
    }), children, /*#__PURE__*/ (0, ($parcel$interopDefault($gYMUj$react))).createElement("span", {
        "data-focus-scope-end": true,
        hidden: true,
        ref: endRef
    }));
}
function $9fb4ac1cc58342cc$export$10c5169755ce7bd7() {
    return (0, $gYMUj$react.useContext)($9fb4ac1cc58342cc$var$FocusContext)?.focusManager;
}
function $9fb4ac1cc58342cc$var$createFocusManagerForScope(scopeRef) {
    return {
        focusNext (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(scope[0] ?? undefined));
            let sentinel = scope[0].previousElementSibling;
            let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $9fb4ac1cc58342cc$var$isElementInScope(node, scope) ? node : sentinel;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = sentinel;
                nextNode = walker.nextNode();
            }
            if (nextNode) $9fb4ac1cc58342cc$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(scope[0] ?? undefined));
            let sentinel = scope[scope.length - 1].nextElementSibling;
            let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $9fb4ac1cc58342cc$var$isElementInScope(node, scope) ? node : sentinel;
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = sentinel;
                previousNode = walker.previousNode();
            }
            if (previousNode) $9fb4ac1cc58342cc$var$focusElement(previousNode, true);
            return previousNode;
        },
        focusFirst (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[0].previousElementSibling;
            let nextNode = walker.nextNode();
            if (nextNode) $9fb4ac1cc58342cc$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[scope.length - 1].nextElementSibling;
            let previousNode = walker.previousNode();
            if (previousNode) $9fb4ac1cc58342cc$var$focusElement(previousNode, true);
            return previousNode;
        }
    };
}
function $9fb4ac1cc58342cc$var$getScopeRoot(scope) {
    return scope[0].parentElement;
}
function $9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef) {
    let scope = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode($9fb4ac1cc58342cc$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.contain) return false;
        scope = scope.parent;
    }
    return true;
}
function $9fb4ac1cc58342cc$var$getRadiosInGroup(element) {
    if (!element.form) // Radio buttons outside a form - query the document
    return Array.from((0, $49582955cc364b1c$exports.getOwnerDocument)(element).querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`)).filter((radio)=>!radio.form);
    // namedItem returns RadioNodeList (iterable) for 2+ elements, but a single Element for exactly 1.
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection/namedItem
    const radioList = element.form.elements.namedItem(element.name);
    let ownerWindow = (0, $49582955cc364b1c$exports.getOwnerWindow)(element);
    if (radioList instanceof ownerWindow.RadioNodeList) return Array.from(radioList).filter((el)=>el instanceof ownerWindow.HTMLInputElement);
    if (radioList instanceof ownerWindow.HTMLInputElement) return [
        radioList
    ];
    return [];
}
function $9fb4ac1cc58342cc$var$isTabbableRadio(element) {
    if (element.checked) return true;
    const radios = $9fb4ac1cc58342cc$var$getRadiosInGroup(element);
    return radios.length > 0 && !radios.some((radio)=>radio.checked);
}
function $9fb4ac1cc58342cc$var$useFocusContainment(scopeRef, contain) {
    let focusedNode = (0, $gYMUj$react.useRef)(undefined);
    let raf = (0, $gYMUj$react.useRef)(undefined);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        let scope = scopeRef.current;
        if (!contain) {
            // if contain was changed, then we should cancel any ongoing waits to pull focus back into containment
            if (raf.current) {
                cancelAnimationFrame(raf.current);
                raf.current = undefined;
            }
            return;
        }
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scope ? scope[0] : undefined);
        // Handle the Tab key to contain focus within the scope
        let onKeyDown = (e)=>{
            if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !$9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef) || e.isComposing) return;
            let focusedElement = (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument);
            let scope = scopeRef.current;
            if (!scope || !$9fb4ac1cc58342cc$var$isElementInScope(focusedElement, scope)) return;
            let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: true
            }, scope);
            if (!focusedElement) return;
            walker.currentNode = focusedElement;
            let nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            if (!nextElement) {
                walker.currentNode = e.shiftKey ? scope[scope.length - 1].nextElementSibling : scope[0].previousElementSibling;
                nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            }
            e.preventDefault();
            if (nextElement) {
                $9fb4ac1cc58342cc$var$focusElement(nextElement, true);
                if (nextElement instanceof (0, $49582955cc364b1c$exports.getOwnerWindow)(nextElement).HTMLInputElement) nextElement.select();
            }
        };
        let onFocus = (e)=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$9fb4ac1cc58342cc$var$activeScope || $9fb4ac1cc58342cc$var$isAncestorScope($9fb4ac1cc58342cc$var$activeScope, scopeRef)) && $9fb4ac1cc58342cc$var$isElementInScope((0, $da02ee888921bc9e$exports.getEventTarget)(e), scopeRef.current)) {
                $9fb4ac1cc58342cc$var$activeScope = scopeRef;
                focusedNode.current = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
            } else if ($9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef) && !$9fb4ac1cc58342cc$var$isElementInChildScope((0, $da02ee888921bc9e$exports.getEventTarget)(e), scopeRef)) {
                // If a focus event occurs outside the active scope (e.g. user tabs from browser location bar),
                // restore focus to the previously focused node or the first tabbable element in the active scope.
                if (focusedNode.current) focusedNode.current.focus();
                else if ($9fb4ac1cc58342cc$var$activeScope && $9fb4ac1cc58342cc$var$activeScope.current) $9fb4ac1cc58342cc$var$focusFirstInScope($9fb4ac1cc58342cc$var$activeScope.current);
            } else if ($9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef)) focusedNode.current = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        };
        let onBlur = (e)=>{
            // Firefox doesn't shift focus back to the Dialog properly without this
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(()=>{
                // Patches infinite focus coersion loop for Android Talkback where the user isn't able to move the virtual cursor
                // if within a containing focus scope. Bug filed against Chrome: https://issuetracker.google.com/issues/384844019.
                // Note that this means focus can leave focus containing modals due to this, but it is isolated to Chrome Talkback.
                let modality = (0, $d0df89f3abe2c2ca$exports.getInteractionModality)();
                let shouldSkipFocusRestore = (modality === 'virtual' || modality === null) && (0, $d0b4a781cf26e80b$exports.isAndroid)() && (0, $d0b4a781cf26e80b$exports.isChrome)();
                // Use document.activeElement instead of e.relatedTarget so we can tell if user clicked into iframe
                let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument);
                if (!shouldSkipFocusRestore && activeElement && $9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef) && !$9fb4ac1cc58342cc$var$isElementInChildScope(activeElement, scopeRef)) {
                    $9fb4ac1cc58342cc$var$activeScope = scopeRef;
                    let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
                    if (target && target.isConnected) {
                        focusedNode.current = target;
                        focusedNode.current?.focus();
                    } else if ($9fb4ac1cc58342cc$var$activeScope.current) $9fb4ac1cc58342cc$var$focusFirstInScope($9fb4ac1cc58342cc$var$activeScope.current);
                }
            });
        };
        ownerDocument.addEventListener('keydown', onKeyDown, false);
        ownerDocument.addEventListener('focusin', onFocus, false);
        scope?.forEach((element)=>element.addEventListener('focusin', onFocus, false));
        scope?.forEach((element)=>element.addEventListener('focusout', onBlur, false));
        return ()=>{
            ownerDocument.removeEventListener('keydown', onKeyDown, false);
            ownerDocument.removeEventListener('focusin', onFocus, false);
            scope?.forEach((element)=>element.removeEventListener('focusin', onFocus, false));
            scope?.forEach((element)=>element.removeEventListener('focusout', onBlur, false));
        };
    }, [
        scopeRef,
        contain
    ]);
    // This is a useLayoutEffect so it is guaranteed to run before our async synthetic blur
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [
        raf
    ]);
}
function $9fb4ac1cc58342cc$var$isElementInAnyScope(element) {
    return $9fb4ac1cc58342cc$var$isElementInChildScope(element);
}
function $9fb4ac1cc58342cc$var$isElementInScope(element, scope) {
    if (!element) return false;
    if (!scope) return false;
    return scope.some((node)=>(0, $da02ee888921bc9e$exports.nodeContains)(node, element));
}
function $9fb4ac1cc58342cc$var$isElementInChildScope(element, scope = null) {
    // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
    if (element instanceof Element && element.closest('[data-react-aria-top-layer]')) return true;
    // node.contains in isElementInScope covers child scopes that are also DOM children,
    // but does not cover child scopes in portals.
    for (let { scopeRef: s } of $9fb4ac1cc58342cc$export$d06fae2ee68b101e.traverse($9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scope))){
        if (s && $9fb4ac1cc58342cc$var$isElementInScope(element, s.current)) return true;
    }
    return false;
}
function $9fb4ac1cc58342cc$export$1258395f99bf9cbf(element) {
    return $9fb4ac1cc58342cc$var$isElementInChildScope(element, $9fb4ac1cc58342cc$var$activeScope);
}
function $9fb4ac1cc58342cc$var$isAncestorScope(ancestor, scope) {
    let parent = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scope)?.parent;
    while(parent){
        if (parent.scopeRef === ancestor) return true;
        parent = parent.parent;
    }
    return false;
}
function $9fb4ac1cc58342cc$var$focusElement(element, scroll = false) {
    if (element != null && !scroll) try {
        (0, $4a053a4bf25e52fb$exports.focusSafely)(element);
    } catch  {
    // ignore
    }
    else if (element != null) try {
        element.focus();
    } catch  {
    // ignore
    }
}
function $9fb4ac1cc58342cc$var$getFirstInScope(scope, tabbable = true) {
    let sentinel = scope[0].previousElementSibling;
    let scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
    let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
        tabbable: tabbable
    }, scope);
    walker.currentNode = sentinel;
    let nextNode = walker.nextNode();
    // If the scope does not contain a tabbable element, use the first focusable element.
    if (tabbable && !nextNode) {
        scopeRoot = $9fb4ac1cc58342cc$var$getScopeRoot(scope);
        walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(scopeRoot, {
            tabbable: false
        }, scope);
        walker.currentNode = sentinel;
        nextNode = walker.nextNode();
    }
    return nextNode;
}
function $9fb4ac1cc58342cc$var$focusFirstInScope(scope, tabbable = true) {
    $9fb4ac1cc58342cc$var$focusElement($9fb4ac1cc58342cc$var$getFirstInScope(scope, tabbable));
}
function $9fb4ac1cc58342cc$var$useAutoFocus(scopeRef, autoFocus) {
    const autoFocusRef = (0, ($parcel$interopDefault($gYMUj$react))).useRef(autoFocus);
    (0, $gYMUj$react.useEffect)(()=>{
        if (autoFocusRef.current) {
            $9fb4ac1cc58342cc$var$activeScope = scopeRef;
            const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
            if (!$9fb4ac1cc58342cc$var$isElementInScope((0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument), $9fb4ac1cc58342cc$var$activeScope.current) && scopeRef.current) $9fb4ac1cc58342cc$var$focusFirstInScope(scopeRef.current);
        }
        autoFocusRef.current = false;
    }, [
        scopeRef
    ]);
}
function $9fb4ac1cc58342cc$var$useActiveScopeTracker(scopeRef, restore, contain) {
    // tracks the active scope, in case restore and contain are both false.
    // if either are true, this is tracked in useRestoreFocus or useFocusContainment.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (restore || contain) return;
        let scope = scopeRef.current;
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scope ? scope[0] : undefined);
        let onFocus = (e)=>{
            let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
            if ($9fb4ac1cc58342cc$var$isElementInScope(target, scopeRef.current)) $9fb4ac1cc58342cc$var$activeScope = scopeRef;
            else if (!$9fb4ac1cc58342cc$var$isElementInAnyScope(target)) $9fb4ac1cc58342cc$var$activeScope = null;
        };
        ownerDocument.addEventListener('focusin', onFocus, false);
        scope?.forEach((element)=>element.addEventListener('focusin', onFocus, false));
        return ()=>{
            ownerDocument.removeEventListener('focusin', onFocus, false);
            scope?.forEach((element)=>element.removeEventListener('focusin', onFocus, false));
        };
    }, [
        scopeRef,
        restore,
        contain
    ]);
}
function $9fb4ac1cc58342cc$var$shouldRestoreFocus(scopeRef) {
    let scope = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode($9fb4ac1cc58342cc$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.nodeToRestore) return false;
        scope = scope.parent;
    }
    return scope?.scopeRef === scopeRef;
}
function $9fb4ac1cc58342cc$var$useRestoreFocus(scopeRef, restoreFocus, contain) {
    // create a ref during render instead of useLayoutEffect so the active element is saved before a child with autoFocus=true mounts.
    const nodeToRestoreRef = (0, $gYMUj$react.useRef)(typeof document !== 'undefined' ? (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined)) : null);
    // restoring scopes should all track if they are active regardless of contain, but contain already tracks it plus logic to contain the focus
    // restoring-non-containing scopes should only care if they become active so they can perform the restore
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        let scope = scopeRef.current;
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scope ? scope[0] : undefined);
        if (!restoreFocus || contain) return;
        let onFocus = ()=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$9fb4ac1cc58342cc$var$activeScope || $9fb4ac1cc58342cc$var$isAncestorScope($9fb4ac1cc58342cc$var$activeScope, scopeRef)) && $9fb4ac1cc58342cc$var$isElementInScope((0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument), scopeRef.current)) $9fb4ac1cc58342cc$var$activeScope = scopeRef;
        };
        ownerDocument.addEventListener('focusin', onFocus, false);
        scope?.forEach((element)=>element.addEventListener('focusin', onFocus, false));
        return ()=>{
            ownerDocument.removeEventListener('focusin', onFocus, false);
            scope?.forEach((element)=>element.removeEventListener('focusin', onFocus, false));
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        scopeRef,
        contain
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        // Handle the Tab key so that tabbing out of the scope goes to the next element
        // after the node that had focus when the scope mounted. This is important when
        // using portals for overlays, so that focus goes to the expected element when
        // tabbing out of the overlay.
        let onKeyDown = (e)=>{
            if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !$9fb4ac1cc58342cc$var$shouldContainFocus(scopeRef) || e.isComposing) return;
            let focusedElement = ownerDocument.activeElement;
            if (!$9fb4ac1cc58342cc$var$isElementInChildScope(focusedElement, scopeRef) || !$9fb4ac1cc58342cc$var$shouldRestoreFocus(scopeRef)) return;
            let treeNode = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // Create a DOM tree walker that matches all tabbable elements
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(ownerDocument.body, {
                tabbable: true
            });
            // Find the next tabbable element after the currently focused element
            walker.currentNode = focusedElement;
            let nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
            if (!nodeToRestore || !nodeToRestore.isConnected || nodeToRestore === ownerDocument.body) {
                nodeToRestore = undefined;
                treeNode.nodeToRestore = undefined;
            }
            // If there is no next element, or it is outside the current scope, move focus to the
            // next element after the node to restore to instead.
            if ((!nextElement || !$9fb4ac1cc58342cc$var$isElementInChildScope(nextElement, scopeRef)) && nodeToRestore) {
                walker.currentNode = nodeToRestore;
                // Skip over elements within the scope, in case the scope immediately follows the node to restore.
                do nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
                while ($9fb4ac1cc58342cc$var$isElementInChildScope(nextElement, scopeRef));
                e.preventDefault();
                e.stopPropagation();
                if (nextElement) $9fb4ac1cc58342cc$var$focusElement(nextElement, true);
                else // If there is no next element and the nodeToRestore isn't within a FocusScope (i.e. we are leaving the top level focus scope)
                // then move focus to the body.
                // Otherwise restore focus to the nodeToRestore (e.g menu within a popover -> tabbing to close the menu should move focus to menu trigger)
                if (!$9fb4ac1cc58342cc$var$isElementInAnyScope(nodeToRestore)) focusedElement.blur();
                else $9fb4ac1cc58342cc$var$focusElement(nodeToRestore, true);
            }
        };
        if (!contain) ownerDocument.addEventListener('keydown', onKeyDown, true);
        return ()=>{
            if (!contain) ownerDocument.removeEventListener('keydown', onKeyDown, true);
        };
    }, [
        scopeRef,
        restoreFocus,
        contain
    ]);
    // useLayoutEffect instead of useEffect so the active element is saved synchronously instead of asynchronously.
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        const ownerDocument = (0, $49582955cc364b1c$exports.getOwnerDocument)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        let treeNode = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (!treeNode) return;
        treeNode.nodeToRestore = nodeToRestoreRef.current ?? undefined;
        return ()=>{
            let treeNode = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // if we already lost focus to the body and this was the active scope, then we should attempt to restore
            let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)(ownerDocument);
            if (restoreFocus && nodeToRestore && (activeElement && $9fb4ac1cc58342cc$var$isElementInChildScope(activeElement, scopeRef) || activeElement === ownerDocument.body && $9fb4ac1cc58342cc$var$shouldRestoreFocus(scopeRef))) {
                // freeze the focusScopeTree so it persists after the raf, otherwise during unmount nodes are removed from it
                let clonedTree = $9fb4ac1cc58342cc$export$d06fae2ee68b101e.clone();
                requestAnimationFrame(()=>{
                    // Only restore focus if we've lost focus to the body, the alternative is that focus has been purposefully moved elsewhere
                    if (ownerDocument.activeElement === ownerDocument.body) {
                        // look up the tree starting with our scope to find a nodeToRestore still in the DOM
                        let treeNode = clonedTree.getTreeNode(scopeRef);
                        while(treeNode){
                            if (treeNode.nodeToRestore && treeNode.nodeToRestore.isConnected) {
                                $9fb4ac1cc58342cc$var$restoreFocusToElement(treeNode.nodeToRestore);
                                return;
                            }
                            treeNode = treeNode.parent;
                        }
                        // If no nodeToRestore was found, focus the first element in the nearest
                        // ancestor scope that is still in the tree.
                        treeNode = clonedTree.getTreeNode(scopeRef);
                        while(treeNode){
                            if (treeNode.scopeRef && // TODO: this is probably a false positive based on naming, it's not a real ref, rename.
                            // oxlint-disable-next-line react-hooks/exhaustive-deps
                            treeNode.scopeRef.current && $9fb4ac1cc58342cc$export$d06fae2ee68b101e.getTreeNode(treeNode.scopeRef)) {
                                // oxlint-disable-next-line react-hooks/exhaustive-deps
                                let node = $9fb4ac1cc58342cc$var$getFirstInScope(treeNode.scopeRef.current, true);
                                $9fb4ac1cc58342cc$var$restoreFocusToElement(node);
                                return;
                            }
                            treeNode = treeNode.parent;
                        }
                    }
                });
            }
        };
    }, [
        scopeRef,
        restoreFocus
    ]);
}
function $9fb4ac1cc58342cc$var$restoreFocusToElement(node) {
    // Dispatch a custom event that parent elements can intercept to customize focus restoration.
    // For example, virtualized collection components reuse DOM elements, so the original element
    // might still exist in the DOM but representing a different item.
    if (node.dispatchEvent(new CustomEvent($9fb4ac1cc58342cc$var$RESTORE_FOCUS_EVENT, {
        bubbles: true,
        cancelable: true
    }))) $9fb4ac1cc58342cc$var$focusElement(node);
}
function $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(root, opts, scope) {
    let filter = opts?.tabbable ? (0, $48f566b6becd50da$exports.isTabbable) : (0, $48f566b6becd50da$exports.isFocusable);
    // Ensure that root is an Element or fall back appropriately
    let rootElement = root?.nodeType === Node.ELEMENT_NODE ? root : null;
    // Determine the document to use
    let doc = (0, $49582955cc364b1c$exports.getOwnerDocument)(rootElement);
    // Create a TreeWalker, ensuring the root is an Element or Document
    let walker = (0, $4ca29ec9516c15bb$exports.createShadowTreeWalker)(doc, root || doc, NodeFilter.SHOW_ELEMENT, {
        acceptNode (node) {
            // Skip nodes inside the starting node.
            if ((0, $da02ee888921bc9e$exports.nodeContains)(opts?.from, node)) return NodeFilter.FILTER_REJECT;
            if (opts?.tabbable && node.tagName === 'INPUT' && node.getAttribute('type') === 'radio') {
                // If the radio is in a form, we can get all the other radios by name
                if (!$9fb4ac1cc58342cc$var$isTabbableRadio(node)) return NodeFilter.FILTER_REJECT;
                // If the radio is in the same group as the current node and none are selected, we can skip it
                if (walker.currentNode.tagName === 'INPUT' && walker.currentNode.type === 'radio' && walker.currentNode.name === node.name) return NodeFilter.FILTER_REJECT;
            }
            if (filter(node) && (!scope || $9fb4ac1cc58342cc$var$isElementInScope(node, scope)) && (!opts?.accept || opts.accept(node))) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_SKIP;
        }
    });
    if (opts?.from) walker.currentNode = opts.from;
    return walker;
}
function $9fb4ac1cc58342cc$export$c5251b9e124bf29(ref, defaultOptions = {}) {
    return {
        focusNext (opts = {}) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(root));
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if ((0, $da02ee888921bc9e$exports.nodeContains)(root, node)) walker.currentNode = node;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = root;
                nextNode = walker.nextNode();
            }
            if (nextNode) $9fb4ac1cc58342cc$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(root));
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if ((0, $da02ee888921bc9e$exports.nodeContains)(root, node)) walker.currentNode = node;
            else {
                let next = $9fb4ac1cc58342cc$var$last(walker);
                if (next) $9fb4ac1cc58342cc$var$focusElement(next, true);
                return next ?? null;
            }
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = root;
                let lastNode = $9fb4ac1cc58342cc$var$last(walker);
                if (!lastNode) // couldn't wrap
                return null;
                previousNode = lastNode;
            }
            if (previousNode) $9fb4ac1cc58342cc$var$focusElement(previousNode, true);
            return previousNode ?? null;
        },
        focusFirst (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let nextNode = walker.nextNode();
            if (nextNode) $9fb4ac1cc58342cc$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $9fb4ac1cc58342cc$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let next = $9fb4ac1cc58342cc$var$last(walker);
            if (next) $9fb4ac1cc58342cc$var$focusElement(next, true);
            return next ?? null;
        }
    };
}
function $9fb4ac1cc58342cc$var$last(walker) {
    let next = undefined;
    let last;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
class $9fb4ac1cc58342cc$var$Tree {
    constructor(){
        this.fastMap = new Map();
        this.root = new $9fb4ac1cc58342cc$var$TreeNode({
            scopeRef: null
        });
        this.fastMap.set(null, this.root);
    }
    get size() {
        return this.fastMap.size;
    }
    getTreeNode(data) {
        return this.fastMap.get(data);
    }
    addTreeNode(scopeRef, parent, nodeToRestore) {
        let parentNode = this.fastMap.get(parent ?? null);
        if (!parentNode) return;
        let node = new $9fb4ac1cc58342cc$var$TreeNode({
            scopeRef: scopeRef
        });
        parentNode.addChild(node);
        node.parent = parentNode;
        this.fastMap.set(scopeRef, node);
        if (nodeToRestore) node.nodeToRestore = nodeToRestore;
    }
    addNode(node) {
        this.fastMap.set(node.scopeRef, node);
    }
    removeTreeNode(scopeRef) {
        // never remove the root
        if (scopeRef === null) return;
        let node = this.fastMap.get(scopeRef);
        if (!node) return;
        let parentNode = node.parent;
        // when we remove a scope, check if any sibling scopes are trying to restore focus to something inside the scope we're removing
        // if we are, then replace the siblings restore with the restore from the scope we're removing
        for (let current of this.traverse())if (current !== node && node.nodeToRestore && current.nodeToRestore && node.scopeRef && node.scopeRef.current && $9fb4ac1cc58342cc$var$isElementInScope(current.nodeToRestore, node.scopeRef.current)) current.nodeToRestore = node.nodeToRestore;
        let children = node.children;
        if (parentNode) {
            parentNode.removeChild(node);
            if (children.size > 0) children.forEach((child)=>parentNode && parentNode.addChild(child));
        }
        this.fastMap.delete(node.scopeRef);
    }
    // Pre Order Depth First
    *traverse(node = this.root) {
        if (node.scopeRef != null) yield node;
        if (node.children.size > 0) for (let child of node.children)yield* this.traverse(child);
    }
    clone() {
        let newTree = new $9fb4ac1cc58342cc$var$Tree();
        for (let node of this.traverse())newTree.addTreeNode(node.scopeRef, node.parent?.scopeRef ?? null, node.nodeToRestore);
        return newTree;
    }
}
class $9fb4ac1cc58342cc$var$TreeNode {
    constructor(props){
        this.children = new Set();
        this.contain = false;
        this.scopeRef = props.scopeRef;
    }
    addChild(node) {
        this.children.add(node);
        node.parent = this;
    }
    removeChild(node) {
        this.children.delete(node);
        node.parent = undefined;
    }
}
let $9fb4ac1cc58342cc$export$d06fae2ee68b101e = new $9fb4ac1cc58342cc$var$Tree();


//# sourceMappingURL=FocusScope.cjs.map
