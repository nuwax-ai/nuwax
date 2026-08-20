import {createShadowTreeWalker as $654b97e09f2a30c1$export$4d0f8be8b12a7ef6} from "../utils/shadowdom/ShadowTreeWalker.mjs";
import {focusSafely as $f192c2f16961cbe0$export$80f3e147d781571c} from "../interactions/focusSafely.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getInteractionModality as $8f5a2122b0992be3$export$630ff653c5ada6a9} from "../interactions/useFocusVisible.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac, getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {isAndroid as $2add3ce32c6007eb$export$a11b0059900ceec8, isChrome as $2add3ce32c6007eb$export$6446a186d09e379e} from "../utils/platform.mjs";
import {isFocusable as $3b8b240c1bf84ab9$export$4c063cf1350e6fed, isTabbable as $3b8b240c1bf84ab9$export$bebd5a1431fec25d} from "../utils/isFocusable.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import $jmfRy$react, {useRef as $jmfRy$useRef, useContext as $jmfRy$useContext, useMemo as $jmfRy$useMemo, useEffect as $jmfRy$useEffect} from "react";

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








const $535772f9d2c1f38d$var$FocusContext = /*#__PURE__*/ (0, $jmfRy$react).createContext(null);
const $535772f9d2c1f38d$var$RESTORE_FOCUS_EVENT = 'react-aria-focus-scope-restore';
let $535772f9d2c1f38d$var$activeScope = null;
function $535772f9d2c1f38d$export$20e40289641fbbb6(props) {
    let { children: children, contain: contain, restoreFocus: restoreFocus, autoFocus: autoFocus } = props;
    let startRef = (0, $jmfRy$useRef)(null);
    let endRef = (0, $jmfRy$useRef)(null);
    let scopeRef = (0, $jmfRy$useRef)([]);
    let { parentNode: parentNode } = (0, $jmfRy$useContext)($535772f9d2c1f38d$var$FocusContext) || {};
    // Create a tree node here so we can add children to it even before it is added to the tree.
    let node = (0, $jmfRy$useMemo)(()=>new $535772f9d2c1f38d$var$TreeNode({
            scopeRef: scopeRef
        }), [
        scopeRef
    ]);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        // If a new scope mounts outside the active scope, (e.g. DialogContainer launched from a menu),
        // use the active scope as the parent instead of the parent from context. Layout effects run bottom
        // up, so if the parent is not yet added to the tree, don't do this. Only the outer-most FocusScope
        // that is being added should get the activeScope as its parent.
        let parent = parentNode || $535772f9d2c1f38d$export$d06fae2ee68b101e.root;
        if ($535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(parent.scopeRef) && $535772f9d2c1f38d$var$activeScope && !$535772f9d2c1f38d$var$isAncestorScope($535772f9d2c1f38d$var$activeScope, parent.scopeRef)) {
            let activeNode = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode($535772f9d2c1f38d$var$activeScope);
            if (activeNode) parent = activeNode;
        }
        // Add the node to the parent, and to the tree.
        parent.addChild(node);
        $535772f9d2c1f38d$export$d06fae2ee68b101e.addNode(node);
    }, [
        node,
        parentNode
    ]);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let node = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (node) node.contain = !!contain;
    }, [
        contain
    ]);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        // Find all rendered nodes between the sentinels and add them to the scope.
        let node = startRef.current?.nextSibling;
        let nodes = [];
        let stopPropagation = (e)=>e.stopPropagation();
        while(node && node !== endRef.current){
            nodes.push(node);
            // Stop custom restore focus event from propagating to parent focus scopes.
            node.addEventListener($535772f9d2c1f38d$var$RESTORE_FOCUS_EVENT, stopPropagation);
            node = node.nextSibling;
        }
        scopeRef.current = nodes;
        return ()=>{
            for (let node of nodes)node.removeEventListener($535772f9d2c1f38d$var$RESTORE_FOCUS_EVENT, stopPropagation);
        };
    }, [
        children
    ]);
    $535772f9d2c1f38d$var$useActiveScopeTracker(scopeRef, restoreFocus, contain);
    $535772f9d2c1f38d$var$useFocusContainment(scopeRef, contain);
    $535772f9d2c1f38d$var$useRestoreFocus(scopeRef, restoreFocus, contain);
    $535772f9d2c1f38d$var$useAutoFocus(scopeRef, autoFocus);
    // This needs to be an effect so that activeScope is updated after the FocusScope tree is complete.
    // It cannot be a useLayoutEffect because the parent of this node hasn't been attached in the tree yet.
    (0, $jmfRy$useEffect)(()=>{
        const activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(scopeRef.current ? scopeRef.current[0] : undefined));
        let scope = null;
        if ($535772f9d2c1f38d$var$isElementInScope(activeElement, scopeRef.current)) {
            // We need to traverse the focusScope tree and find the bottom most scope that
            // contains the active element and set that as the activeScope.
            for (let node of $535772f9d2c1f38d$export$d06fae2ee68b101e.traverse())if (node.scopeRef && $535772f9d2c1f38d$var$isElementInScope(activeElement, node.scopeRef.current)) scope = node;
            if (scope === $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef)) $535772f9d2c1f38d$var$activeScope = scope.scopeRef;
        }
    }, [
        scopeRef
    ]);
    // This layout effect cleanup is so that the tree node is removed synchronously with react before the RAF
    // in useRestoreFocus cleanup runs.
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        return ()=>{
            // Scope may have been re-parented.
            let parentScope = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef)?.parent?.scopeRef ?? null;
            if ((scopeRef === $535772f9d2c1f38d$var$activeScope || $535772f9d2c1f38d$var$isAncestorScope(scopeRef, $535772f9d2c1f38d$var$activeScope)) && (!parentScope || $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(parentScope))) $535772f9d2c1f38d$var$activeScope = parentScope;
            $535772f9d2c1f38d$export$d06fae2ee68b101e.removeTreeNode(scopeRef);
        };
    }, [
        scopeRef
    ]);
    let focusManager = (0, $jmfRy$useMemo)(()=>$535772f9d2c1f38d$var$createFocusManagerForScope(scopeRef), []);
    let value = (0, $jmfRy$useMemo)(()=>({
            focusManager: focusManager,
            parentNode: node
        }), [
        node,
        focusManager
    ]);
    return /*#__PURE__*/ (0, $jmfRy$react).createElement($535772f9d2c1f38d$var$FocusContext.Provider, {
        value: value
    }, /*#__PURE__*/ (0, $jmfRy$react).createElement("span", {
        "data-focus-scope-start": true,
        hidden: true,
        ref: startRef
    }), children, /*#__PURE__*/ (0, $jmfRy$react).createElement("span", {
        "data-focus-scope-end": true,
        hidden: true,
        ref: endRef
    }));
}
function $535772f9d2c1f38d$export$10c5169755ce7bd7() {
    return (0, $jmfRy$useContext)($535772f9d2c1f38d$var$FocusContext)?.focusManager;
}
function $535772f9d2c1f38d$var$createFocusManagerForScope(scopeRef) {
    return {
        focusNext (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(scope[0] ?? undefined));
            let sentinel = scope[0].previousElementSibling;
            let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $535772f9d2c1f38d$var$isElementInScope(node, scope) ? node : sentinel;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = sentinel;
                nextNode = walker.nextNode();
            }
            if (nextNode) $535772f9d2c1f38d$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = {}) {
            let scope = scopeRef.current;
            let { from: from, tabbable: tabbable, wrap: wrap, accept: accept } = opts;
            let node = from || (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(scope[0] ?? undefined));
            let sentinel = scope[scope.length - 1].nextElementSibling;
            let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = $535772f9d2c1f38d$var$isElementInScope(node, scope) ? node : sentinel;
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = sentinel;
                previousNode = walker.previousNode();
            }
            if (previousNode) $535772f9d2c1f38d$var$focusElement(previousNode, true);
            return previousNode;
        },
        focusFirst (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[0].previousElementSibling;
            let nextNode = walker.nextNode();
            if (nextNode) $535772f9d2c1f38d$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = {}) {
            let scope = scopeRef.current;
            let { tabbable: tabbable, accept: accept } = opts;
            let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
                tabbable: tabbable,
                accept: accept
            }, scope);
            walker.currentNode = scope[scope.length - 1].nextElementSibling;
            let previousNode = walker.previousNode();
            if (previousNode) $535772f9d2c1f38d$var$focusElement(previousNode, true);
            return previousNode;
        }
    };
}
function $535772f9d2c1f38d$var$getScopeRoot(scope) {
    return scope[0].parentElement;
}
function $535772f9d2c1f38d$var$shouldContainFocus(scopeRef) {
    let scope = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode($535772f9d2c1f38d$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.contain) return false;
        scope = scope.parent;
    }
    return true;
}
function $535772f9d2c1f38d$var$getRadiosInGroup(element) {
    if (!element.form) // Radio buttons outside a form - query the document
    return Array.from((0, $d447af545b77c9f1$export$b204af158042fbac)(element).querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`)).filter((radio)=>!radio.form);
    // namedItem returns RadioNodeList (iterable) for 2+ elements, but a single Element for exactly 1.
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormControlsCollection/namedItem
    const radioList = element.form.elements.namedItem(element.name);
    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)(element);
    if (radioList instanceof ownerWindow.RadioNodeList) return Array.from(radioList).filter((el)=>el instanceof ownerWindow.HTMLInputElement);
    if (radioList instanceof ownerWindow.HTMLInputElement) return [
        radioList
    ];
    return [];
}
function $535772f9d2c1f38d$var$isTabbableRadio(element) {
    if (element.checked) return true;
    const radios = $535772f9d2c1f38d$var$getRadiosInGroup(element);
    return radios.length > 0 && !radios.some((radio)=>radio.checked);
}
function $535772f9d2c1f38d$var$useFocusContainment(scopeRef, contain) {
    let focusedNode = (0, $jmfRy$useRef)(undefined);
    let raf = (0, $jmfRy$useRef)(undefined);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let scope = scopeRef.current;
        if (!contain) {
            // if contain was changed, then we should cancel any ongoing waits to pull focus back into containment
            if (raf.current) {
                cancelAnimationFrame(raf.current);
                raf.current = undefined;
            }
            return;
        }
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scope ? scope[0] : undefined);
        // Handle the Tab key to contain focus within the scope
        let onKeyDown = (e)=>{
            if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !$535772f9d2c1f38d$var$shouldContainFocus(scopeRef) || e.isComposing) return;
            let focusedElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument);
            let scope = scopeRef.current;
            if (!scope || !$535772f9d2c1f38d$var$isElementInScope(focusedElement, scope)) return;
            let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
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
                $535772f9d2c1f38d$var$focusElement(nextElement, true);
                if (nextElement instanceof (0, $d447af545b77c9f1$export$f21a1ffae260145a)(nextElement).HTMLInputElement) nextElement.select();
            }
        };
        let onFocus = (e)=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$535772f9d2c1f38d$var$activeScope || $535772f9d2c1f38d$var$isAncestorScope($535772f9d2c1f38d$var$activeScope, scopeRef)) && $535772f9d2c1f38d$var$isElementInScope((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), scopeRef.current)) {
                $535772f9d2c1f38d$var$activeScope = scopeRef;
                focusedNode.current = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
            } else if ($535772f9d2c1f38d$var$shouldContainFocus(scopeRef) && !$535772f9d2c1f38d$var$isElementInChildScope((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), scopeRef)) {
                // If a focus event occurs outside the active scope (e.g. user tabs from browser location bar),
                // restore focus to the previously focused node or the first tabbable element in the active scope.
                if (focusedNode.current) focusedNode.current.focus();
                else if ($535772f9d2c1f38d$var$activeScope && $535772f9d2c1f38d$var$activeScope.current) $535772f9d2c1f38d$var$focusFirstInScope($535772f9d2c1f38d$var$activeScope.current);
            } else if ($535772f9d2c1f38d$var$shouldContainFocus(scopeRef)) focusedNode.current = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        };
        let onBlur = (e)=>{
            // Firefox doesn't shift focus back to the Dialog properly without this
            if (raf.current) cancelAnimationFrame(raf.current);
            raf.current = requestAnimationFrame(()=>{
                // Patches infinite focus coersion loop for Android Talkback where the user isn't able to move the virtual cursor
                // if within a containing focus scope. Bug filed against Chrome: https://issuetracker.google.com/issues/384844019.
                // Note that this means focus can leave focus containing modals due to this, but it is isolated to Chrome Talkback.
                let modality = (0, $8f5a2122b0992be3$export$630ff653c5ada6a9)();
                let shouldSkipFocusRestore = (modality === 'virtual' || modality === null) && (0, $2add3ce32c6007eb$export$a11b0059900ceec8)() && (0, $2add3ce32c6007eb$export$6446a186d09e379e)();
                // Use document.activeElement instead of e.relatedTarget so we can tell if user clicked into iframe
                let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument);
                if (!shouldSkipFocusRestore && activeElement && $535772f9d2c1f38d$var$shouldContainFocus(scopeRef) && !$535772f9d2c1f38d$var$isElementInChildScope(activeElement, scopeRef)) {
                    $535772f9d2c1f38d$var$activeScope = scopeRef;
                    let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
                    if (target && target.isConnected) {
                        focusedNode.current = target;
                        focusedNode.current?.focus();
                    } else if ($535772f9d2c1f38d$var$activeScope.current) $535772f9d2c1f38d$var$focusFirstInScope($535772f9d2c1f38d$var$activeScope.current);
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
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, [
        raf
    ]);
}
function $535772f9d2c1f38d$var$isElementInAnyScope(element) {
    return $535772f9d2c1f38d$var$isElementInChildScope(element);
}
function $535772f9d2c1f38d$var$isElementInScope(element, scope) {
    if (!element) return false;
    if (!scope) return false;
    return scope.some((node)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(node, element));
}
function $535772f9d2c1f38d$var$isElementInChildScope(element, scope = null) {
    // If the element is within a top layer element (e.g. toasts), always allow moving focus there.
    if (element instanceof Element && element.closest('[data-react-aria-top-layer]')) return true;
    // node.contains in isElementInScope covers child scopes that are also DOM children,
    // but does not cover child scopes in portals.
    for (let { scopeRef: s } of $535772f9d2c1f38d$export$d06fae2ee68b101e.traverse($535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scope))){
        if (s && $535772f9d2c1f38d$var$isElementInScope(element, s.current)) return true;
    }
    return false;
}
function $535772f9d2c1f38d$export$1258395f99bf9cbf(element) {
    return $535772f9d2c1f38d$var$isElementInChildScope(element, $535772f9d2c1f38d$var$activeScope);
}
function $535772f9d2c1f38d$var$isAncestorScope(ancestor, scope) {
    let parent = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scope)?.parent;
    while(parent){
        if (parent.scopeRef === ancestor) return true;
        parent = parent.parent;
    }
    return false;
}
function $535772f9d2c1f38d$var$focusElement(element, scroll = false) {
    if (element != null && !scroll) try {
        (0, $f192c2f16961cbe0$export$80f3e147d781571c)(element);
    } catch  {
    // ignore
    }
    else if (element != null) try {
        element.focus();
    } catch  {
    // ignore
    }
}
function $535772f9d2c1f38d$var$getFirstInScope(scope, tabbable = true) {
    let sentinel = scope[0].previousElementSibling;
    let scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
    let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
        tabbable: tabbable
    }, scope);
    walker.currentNode = sentinel;
    let nextNode = walker.nextNode();
    // If the scope does not contain a tabbable element, use the first focusable element.
    if (tabbable && !nextNode) {
        scopeRoot = $535772f9d2c1f38d$var$getScopeRoot(scope);
        walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(scopeRoot, {
            tabbable: false
        }, scope);
        walker.currentNode = sentinel;
        nextNode = walker.nextNode();
    }
    return nextNode;
}
function $535772f9d2c1f38d$var$focusFirstInScope(scope, tabbable = true) {
    $535772f9d2c1f38d$var$focusElement($535772f9d2c1f38d$var$getFirstInScope(scope, tabbable));
}
function $535772f9d2c1f38d$var$useAutoFocus(scopeRef, autoFocus) {
    const autoFocusRef = (0, $jmfRy$react).useRef(autoFocus);
    (0, $jmfRy$useEffect)(()=>{
        if (autoFocusRef.current) {
            $535772f9d2c1f38d$var$activeScope = scopeRef;
            const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scopeRef.current ? scopeRef.current[0] : undefined);
            if (!$535772f9d2c1f38d$var$isElementInScope((0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument), $535772f9d2c1f38d$var$activeScope.current) && scopeRef.current) $535772f9d2c1f38d$var$focusFirstInScope(scopeRef.current);
        }
        autoFocusRef.current = false;
    }, [
        scopeRef
    ]);
}
function $535772f9d2c1f38d$var$useActiveScopeTracker(scopeRef, restore, contain) {
    // tracks the active scope, in case restore and contain are both false.
    // if either are true, this is tracked in useRestoreFocus or useFocusContainment.
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (restore || contain) return;
        let scope = scopeRef.current;
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scope ? scope[0] : undefined);
        let onFocus = (e)=>{
            let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
            if ($535772f9d2c1f38d$var$isElementInScope(target, scopeRef.current)) $535772f9d2c1f38d$var$activeScope = scopeRef;
            else if (!$535772f9d2c1f38d$var$isElementInAnyScope(target)) $535772f9d2c1f38d$var$activeScope = null;
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
function $535772f9d2c1f38d$var$shouldRestoreFocus(scopeRef) {
    let scope = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode($535772f9d2c1f38d$var$activeScope);
    while(scope && scope.scopeRef !== scopeRef){
        if (scope.nodeToRestore) return false;
        scope = scope.parent;
    }
    return scope?.scopeRef === scopeRef;
}
function $535772f9d2c1f38d$var$useRestoreFocus(scopeRef, restoreFocus, contain) {
    // create a ref during render instead of useLayoutEffect so the active element is saved before a child with autoFocus=true mounts.
    const nodeToRestoreRef = (0, $jmfRy$useRef)(typeof document !== 'undefined' ? (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(scopeRef.current ? scopeRef.current[0] : undefined)) : null);
    // restoring scopes should all track if they are active regardless of contain, but contain already tracks it plus logic to contain the focus
    // restoring-non-containing scopes should only care if they become active so they can perform the restore
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let scope = scopeRef.current;
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scope ? scope[0] : undefined);
        if (!restoreFocus || contain) return;
        let onFocus = ()=>{
            // If focusing an element in a child scope of the currently active scope, the child becomes active.
            // Moving out of the active scope to an ancestor is not allowed.
            if ((!$535772f9d2c1f38d$var$activeScope || $535772f9d2c1f38d$var$isAncestorScope($535772f9d2c1f38d$var$activeScope, scopeRef)) && $535772f9d2c1f38d$var$isElementInScope((0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument), scopeRef.current)) $535772f9d2c1f38d$var$activeScope = scopeRef;
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
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        // Handle the Tab key so that tabbing out of the scope goes to the next element
        // after the node that had focus when the scope mounted. This is important when
        // using portals for overlays, so that focus goes to the expected element when
        // tabbing out of the overlay.
        let onKeyDown = (e)=>{
            if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || !$535772f9d2c1f38d$var$shouldContainFocus(scopeRef) || e.isComposing) return;
            let focusedElement = ownerDocument.activeElement;
            if (!$535772f9d2c1f38d$var$isElementInChildScope(focusedElement, scopeRef) || !$535772f9d2c1f38d$var$shouldRestoreFocus(scopeRef)) return;
            let treeNode = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // Create a DOM tree walker that matches all tabbable elements
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(ownerDocument.body, {
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
            if ((!nextElement || !$535772f9d2c1f38d$var$isElementInChildScope(nextElement, scopeRef)) && nodeToRestore) {
                walker.currentNode = nodeToRestore;
                // Skip over elements within the scope, in case the scope immediately follows the node to restore.
                do nextElement = e.shiftKey ? walker.previousNode() : walker.nextNode();
                while ($535772f9d2c1f38d$var$isElementInChildScope(nextElement, scopeRef));
                e.preventDefault();
                e.stopPropagation();
                if (nextElement) $535772f9d2c1f38d$var$focusElement(nextElement, true);
                else // If there is no next element and the nodeToRestore isn't within a FocusScope (i.e. we are leaving the top level focus scope)
                // then move focus to the body.
                // Otherwise restore focus to the nodeToRestore (e.g menu within a popover -> tabbing to close the menu should move focus to menu trigger)
                if (!$535772f9d2c1f38d$var$isElementInAnyScope(nodeToRestore)) focusedElement.blur();
                else $535772f9d2c1f38d$var$focusElement(nodeToRestore, true);
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
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        const ownerDocument = (0, $d447af545b77c9f1$export$b204af158042fbac)(scopeRef.current ? scopeRef.current[0] : undefined);
        if (!restoreFocus) return;
        let treeNode = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef);
        if (!treeNode) return;
        treeNode.nodeToRestore = nodeToRestoreRef.current ?? undefined;
        return ()=>{
            let treeNode = $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(scopeRef);
            if (!treeNode) return;
            let nodeToRestore = treeNode.nodeToRestore;
            // if we already lost focus to the body and this was the active scope, then we should attempt to restore
            let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)(ownerDocument);
            if (restoreFocus && nodeToRestore && (activeElement && $535772f9d2c1f38d$var$isElementInChildScope(activeElement, scopeRef) || activeElement === ownerDocument.body && $535772f9d2c1f38d$var$shouldRestoreFocus(scopeRef))) {
                // freeze the focusScopeTree so it persists after the raf, otherwise during unmount nodes are removed from it
                let clonedTree = $535772f9d2c1f38d$export$d06fae2ee68b101e.clone();
                requestAnimationFrame(()=>{
                    // Only restore focus if we've lost focus to the body, the alternative is that focus has been purposefully moved elsewhere
                    if (ownerDocument.activeElement === ownerDocument.body) {
                        // look up the tree starting with our scope to find a nodeToRestore still in the DOM
                        let treeNode = clonedTree.getTreeNode(scopeRef);
                        while(treeNode){
                            if (treeNode.nodeToRestore && treeNode.nodeToRestore.isConnected) {
                                $535772f9d2c1f38d$var$restoreFocusToElement(treeNode.nodeToRestore);
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
                            treeNode.scopeRef.current && $535772f9d2c1f38d$export$d06fae2ee68b101e.getTreeNode(treeNode.scopeRef)) {
                                // oxlint-disable-next-line react-hooks/exhaustive-deps
                                let node = $535772f9d2c1f38d$var$getFirstInScope(treeNode.scopeRef.current, true);
                                $535772f9d2c1f38d$var$restoreFocusToElement(node);
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
function $535772f9d2c1f38d$var$restoreFocusToElement(node) {
    // Dispatch a custom event that parent elements can intercept to customize focus restoration.
    // For example, virtualized collection components reuse DOM elements, so the original element
    // might still exist in the DOM but representing a different item.
    if (node.dispatchEvent(new CustomEvent($535772f9d2c1f38d$var$RESTORE_FOCUS_EVENT, {
        bubbles: true,
        cancelable: true
    }))) $535772f9d2c1f38d$var$focusElement(node);
}
function $535772f9d2c1f38d$export$2d6ec8fc375ceafa(root, opts, scope) {
    let filter = opts?.tabbable ? (0, $3b8b240c1bf84ab9$export$bebd5a1431fec25d) : (0, $3b8b240c1bf84ab9$export$4c063cf1350e6fed);
    // Ensure that root is an Element or fall back appropriately
    let rootElement = root?.nodeType === Node.ELEMENT_NODE ? root : null;
    // Determine the document to use
    let doc = (0, $d447af545b77c9f1$export$b204af158042fbac)(rootElement);
    // Create a TreeWalker, ensuring the root is an Element or Document
    let walker = (0, $654b97e09f2a30c1$export$4d0f8be8b12a7ef6)(doc, root || doc, NodeFilter.SHOW_ELEMENT, {
        acceptNode (node) {
            // Skip nodes inside the starting node.
            if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(opts?.from, node)) return NodeFilter.FILTER_REJECT;
            if (opts?.tabbable && node.tagName === 'INPUT' && node.getAttribute('type') === 'radio') {
                // If the radio is in a form, we can get all the other radios by name
                if (!$535772f9d2c1f38d$var$isTabbableRadio(node)) return NodeFilter.FILTER_REJECT;
                // If the radio is in the same group as the current node and none are selected, we can skip it
                if (walker.currentNode.tagName === 'INPUT' && walker.currentNode.type === 'radio' && walker.currentNode.name === node.name) return NodeFilter.FILTER_REJECT;
            }
            if (filter(node) && (!scope || $535772f9d2c1f38d$var$isElementInScope(node, scope)) && (!opts?.accept || opts.accept(node))) return NodeFilter.FILTER_ACCEPT;
            return NodeFilter.FILTER_SKIP;
        }
    });
    if (opts?.from) walker.currentNode = opts.from;
    return walker;
}
function $535772f9d2c1f38d$export$c5251b9e124bf29(ref, defaultOptions = {}) {
    return {
        focusNext (opts = {}) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(root));
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(root, node)) walker.currentNode = node;
            let nextNode = walker.nextNode();
            if (!nextNode && wrap) {
                walker.currentNode = root;
                nextNode = walker.nextNode();
            }
            if (nextNode) $535772f9d2c1f38d$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusPrevious (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { from: from, tabbable: tabbable = defaultOptions.tabbable, wrap: wrap = defaultOptions.wrap, accept: accept = defaultOptions.accept } = opts;
            let node = from || (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(root));
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(root, node)) walker.currentNode = node;
            else {
                let next = $535772f9d2c1f38d$var$last(walker);
                if (next) $535772f9d2c1f38d$var$focusElement(next, true);
                return next ?? null;
            }
            let previousNode = walker.previousNode();
            if (!previousNode && wrap) {
                walker.currentNode = root;
                let lastNode = $535772f9d2c1f38d$var$last(walker);
                if (!lastNode) // couldn't wrap
                return null;
                previousNode = lastNode;
            }
            if (previousNode) $535772f9d2c1f38d$var$focusElement(previousNode, true);
            return previousNode ?? null;
        },
        focusFirst (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let nextNode = walker.nextNode();
            if (nextNode) $535772f9d2c1f38d$var$focusElement(nextNode, true);
            return nextNode;
        },
        focusLast (opts = defaultOptions) {
            let root = ref.current;
            if (!root) return null;
            let { tabbable: tabbable = defaultOptions.tabbable, accept: accept = defaultOptions.accept } = opts;
            let walker = $535772f9d2c1f38d$export$2d6ec8fc375ceafa(root, {
                tabbable: tabbable,
                accept: accept
            });
            let next = $535772f9d2c1f38d$var$last(walker);
            if (next) $535772f9d2c1f38d$var$focusElement(next, true);
            return next ?? null;
        }
    };
}
function $535772f9d2c1f38d$var$last(walker) {
    let next = undefined;
    let last;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}
class $535772f9d2c1f38d$var$Tree {
    constructor(){
        this.fastMap = new Map();
        this.root = new $535772f9d2c1f38d$var$TreeNode({
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
        let node = new $535772f9d2c1f38d$var$TreeNode({
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
        for (let current of this.traverse())if (current !== node && node.nodeToRestore && current.nodeToRestore && node.scopeRef && node.scopeRef.current && $535772f9d2c1f38d$var$isElementInScope(current.nodeToRestore, node.scopeRef.current)) current.nodeToRestore = node.nodeToRestore;
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
        let newTree = new $535772f9d2c1f38d$var$Tree();
        for (let node of this.traverse())newTree.addTreeNode(node.scopeRef, node.parent?.scopeRef ?? null, node.nodeToRestore);
        return newTree;
    }
}
class $535772f9d2c1f38d$var$TreeNode {
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
let $535772f9d2c1f38d$export$d06fae2ee68b101e = new $535772f9d2c1f38d$var$Tree();


export {$535772f9d2c1f38d$export$20e40289641fbbb6 as FocusScope, $535772f9d2c1f38d$export$d06fae2ee68b101e as focusScopeTree, $535772f9d2c1f38d$export$10c5169755ce7bd7 as useFocusManager, $535772f9d2c1f38d$export$2d6ec8fc375ceafa as getFocusableTreeWalker, $535772f9d2c1f38d$export$1258395f99bf9cbf as isElementInChildOfActiveScope, $535772f9d2c1f38d$export$c5251b9e124bf29 as createFocusManager};
//# sourceMappingURL=FocusScope.mjs.map
