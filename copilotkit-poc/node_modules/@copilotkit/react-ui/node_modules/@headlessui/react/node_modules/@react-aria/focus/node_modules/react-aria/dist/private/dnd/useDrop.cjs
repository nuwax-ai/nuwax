var $7394b2797bc2343d$exports = require("./DragManager.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $47f95f5edd0c867d$exports = require("./constants.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $b0c8843205a339ea$exports = require("./useVirtualDrop.cjs");
var $k5Rqj$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDrop", function () { return $c73ae148aea93491$export$ccdee5eaf73cf661; });
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








const $c73ae148aea93491$var$DROP_ACTIVATE_TIMEOUT = 800;
function $c73ae148aea93491$export$ccdee5eaf73cf661(options) {
    let { hasDropButton: hasDropButton, isDisabled: isDisabled } = options;
    let [isDropTarget, setDropTarget] = (0, $k5Rqj$react.useState)(false);
    let state = (0, $k5Rqj$react.useRef)({
        x: 0,
        y: 0,
        dragOverElements: new Set(),
        dropEffect: 'none',
        allowedOperations: (0, $47f95f5edd0c867d$exports.DROP_OPERATION).all,
        dropActivateTimer: undefined
    }).current;
    let fireDropEnter = (e)=>{
        setDropTarget(true);
        if (typeof options.onDropEnter === 'function') {
            let rect = e.currentTarget.getBoundingClientRect();
            options.onDropEnter({
                type: 'dropenter',
                x: e.clientX - rect.x,
                y: e.clientY - rect.y
            });
        }
    };
    let fireDropExit = (e)=>{
        setDropTarget(false);
        if (typeof options.onDropExit === 'function') {
            let rect = e.currentTarget.getBoundingClientRect();
            options.onDropExit({
                type: 'dropexit',
                x: e.clientX - rect.x,
                y: e.clientY - rect.y
            });
        }
    };
    let onDragOver = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        let allowedOperations = $c73ae148aea93491$var$getAllowedOperations(e);
        if (e.clientX === state.x && e.clientY === state.y && allowedOperations === state.allowedOperations) {
            e.dataTransfer.dropEffect = state.dropEffect;
            return;
        }
        state.x = e.clientX;
        state.y = e.clientY;
        let prevDropEffect = state.dropEffect;
        // Update drop effect if allowed drop operations changed (e.g. user pressed modifier key).
        if (allowedOperations !== state.allowedOperations) {
            let allowedOps = $c73ae148aea93491$var$allowedOperationsToArray(allowedOperations);
            let dropOperation = allowedOps[0];
            if (typeof options.getDropOperation === 'function') {
                let types = new (0, $c67ff3d36836a1c1$exports.DragTypes)(e.dataTransfer);
                dropOperation = $c73ae148aea93491$var$getDropOperation(allowedOperations, options.getDropOperation(types, allowedOps));
            }
            state.dropEffect = (0, $47f95f5edd0c867d$exports.DROP_OPERATION_TO_DROP_EFFECT)[dropOperation] || 'none';
        }
        if (typeof options.getDropOperationForPoint === 'function') {
            let types = new (0, $c67ff3d36836a1c1$exports.DragTypes)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            let dropOperation = $c73ae148aea93491$var$getDropOperation(allowedOperations, options.getDropOperationForPoint(types, $c73ae148aea93491$var$allowedOperationsToArray(allowedOperations), state.x - rect.x, state.y - rect.y));
            state.dropEffect = (0, $47f95f5edd0c867d$exports.DROP_OPERATION_TO_DROP_EFFECT)[dropOperation] || 'none';
        }
        state.allowedOperations = allowedOperations;
        e.dataTransfer.dropEffect = state.dropEffect;
        // If the drop operation changes, update state and fire events appropriately.
        if (state.dropEffect === 'none' && prevDropEffect !== 'none') fireDropExit(e);
        else if (state.dropEffect !== 'none' && prevDropEffect === 'none') fireDropEnter(e);
        if (typeof options.onDropMove === 'function' && state.dropEffect !== 'none') {
            let rect = e.currentTarget.getBoundingClientRect();
            options.onDropMove({
                type: 'dropmove',
                x: state.x - rect.x,
                y: state.y - rect.y
            });
        }
        clearTimeout(state.dropActivateTimer);
        if (options.onDropActivate && typeof options.onDropActivate === 'function' && state.dropEffect !== 'none') {
            let onDropActivateOptions = options.onDropActivate;
            let rect = e.currentTarget.getBoundingClientRect();
            state.dropActivateTimer = setTimeout(()=>{
                onDropActivateOptions({
                    type: 'dropactivate',
                    x: state.x - rect.x,
                    y: state.y - rect.y
                });
            }, $c73ae148aea93491$var$DROP_ACTIVATE_TIMEOUT);
        }
    };
    let onDragEnter = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        state.dragOverElements.add((0, $da02ee888921bc9e$exports.getEventTarget)(e));
        if (state.dragOverElements.size > 1) return;
        let allowedOperationsBits = $c73ae148aea93491$var$getAllowedOperations(e);
        let allowedOperations = $c73ae148aea93491$var$allowedOperationsToArray(allowedOperationsBits);
        let dropOperation = allowedOperations[0];
        if (typeof options.getDropOperation === 'function') {
            let types = new (0, $c67ff3d36836a1c1$exports.DragTypes)(e.dataTransfer);
            dropOperation = $c73ae148aea93491$var$getDropOperation(allowedOperationsBits, options.getDropOperation(types, allowedOperations));
        }
        if (typeof options.getDropOperationForPoint === 'function') {
            let types = new (0, $c67ff3d36836a1c1$exports.DragTypes)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            dropOperation = $c73ae148aea93491$var$getDropOperation(allowedOperationsBits, options.getDropOperationForPoint(types, allowedOperations, e.clientX - rect.x, e.clientY - rect.y));
        }
        state.x = e.clientX;
        state.y = e.clientY;
        state.allowedOperations = allowedOperationsBits;
        state.dropEffect = (0, $47f95f5edd0c867d$exports.DROP_OPERATION_TO_DROP_EFFECT)[dropOperation] || 'none';
        e.dataTransfer.dropEffect = state.dropEffect;
        if (dropOperation !== 'cancel') fireDropEnter(e);
    };
    let onDragLeave = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        // We would use e.relatedTarget to detect if the drag is still inside the drop target,
        // but it is always null in WebKit. https://bugs.webkit.org/show_bug.cgi?id=66547
        // Instead, we track all of the targets of dragenter events in a set, and remove them
        // in dragleave. When the set becomes empty, we've left the drop target completely.
        // We must also remove any elements that are no longer in the DOM, because dragleave
        // events will never be fired for these. This can happen, for example, with drop
        // indicators between items, which disappear when the drop target changes.
        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        state.dragOverElements.delete(target);
        // Only remove stale elements when leaving the drop target itself.
        // Avoids issues with portal children bubbling dragleave events through the React tree.
        if (target === e.currentTarget) {
            for (let element of state.dragOverElements)if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, element)) state.dragOverElements.delete(element);
        }
        if (state.dragOverElements.size > 0) return;
        if (state.dropEffect !== 'none') fireDropExit(e);
        clearTimeout(state.dropActivateTimer);
    };
    let onDrop = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        // Track drop effect in global state for Chrome Android. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
        // Android onDragEnd always returns "none" as its drop effect.
        (0, $c67ff3d36836a1c1$exports.setGlobalDropEffect)(state.dropEffect);
        if (typeof options.onDrop === 'function') {
            let dropOperation = (0, $47f95f5edd0c867d$exports.DROP_EFFECT_TO_DROP_OPERATION)[state.dropEffect];
            let items = (0, $c67ff3d36836a1c1$exports.readFromDataTransfer)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            let event = {
                type: 'drop',
                x: e.clientX - rect.x,
                y: e.clientY - rect.y,
                items: items,
                dropOperation: dropOperation
            };
            options.onDrop(event);
        }
        let dndStateSnapshot = {
            ...(0, $c67ff3d36836a1c1$exports.globalDndState)
        };
        state.dragOverElements.clear();
        fireDropExit(e);
        clearTimeout(state.dropActivateTimer);
        // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
        // RSP collection and thus we don't need to preserve the global drop effect
        if (dndStateSnapshot.draggingCollectionRef == null) (0, $c67ff3d36836a1c1$exports.setGlobalDropEffect)(undefined);
        else // Otherwise we need to preserve the global dnd state for onDragEnd's isInternal check.
        // At the moment fireDropExit may clear dropCollectionRef (i.e. useDroppableCollection's provided onDropExit, required to clear dropCollectionRef when exiting a valid drop target)
        (0, $c67ff3d36836a1c1$exports.setGlobalDnDState)(dndStateSnapshot);
    };
    let onDropEnter = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (typeof options.onDropEnter === 'function') options.onDropEnter(e);
    });
    let onDropExit = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (typeof options.onDropExit === 'function') options.onDropExit(e);
    });
    let onDropActivate = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (typeof options.onDropActivate === 'function') options.onDropActivate(e);
    });
    let onKeyboardDrop = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        if (typeof options.onDrop === 'function') options.onDrop(e);
    });
    let getDropOperationKeyboard = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((types, allowedOperations)=>{
        if (options.getDropOperation) return options.getDropOperation(types, allowedOperations);
        return allowedOperations[0];
    });
    let { ref: ref } = options;
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (isDisabled || !ref.current) return;
        return $7394b2797bc2343d$exports.registerDropTarget({
            element: ref.current,
            getDropOperation: getDropOperationKeyboard,
            onDropEnter (e) {
                setDropTarget(true);
                onDropEnter(e);
            },
            onDropExit (e) {
                setDropTarget(false);
                onDropExit(e);
            },
            onDrop: onKeyboardDrop,
            onDropActivate: onDropActivate
        });
    }, [
        isDisabled,
        ref
    ]);
    let { dropProps: dropProps } = (0, $b0c8843205a339ea$exports.useVirtualDrop)();
    if (isDisabled) return {
        dropProps: {},
        dropButtonProps: {
            isDisabled: true
        },
        isDropTarget: false
    };
    return {
        dropProps: {
            ...!hasDropButton && dropProps,
            onDragEnter: onDragEnter,
            onDragOver: onDragOver,
            onDragLeave: onDragLeave,
            onDrop: onDrop
        },
        dropButtonProps: {
            ...hasDropButton && dropProps
        },
        isDropTarget: isDropTarget
    };
}
function $c73ae148aea93491$var$getAllowedOperations(e) {
    let allowedOperations = (0, $47f95f5edd0c867d$exports.DROP_OPERATION_ALLOWED)[e.dataTransfer.effectAllowed];
    // WebKit always sets effectAllowed to "copyMove" on macOS, and "all" on iOS, regardless of what was
    // set during the dragstart event: https://bugs.webkit.org/show_bug.cgi?id=178058
    //
    // Android Chrome also sets effectAllowed to "copyMove" in all cases: https://bugs.chromium.org/p/chromium/issues/detail?id=1359182
    //
    // If the drag started within the page, we can use a global variable to get the real allowed operations.
    // This needs to be intersected with the actual effectAllowed, which may have been filtered based on modifier keys.
    // Unfortunately, this means that link operations do not work at all in Safari.
    if (0, $c67ff3d36836a1c1$exports.globalAllowedDropOperations) allowedOperations &= (0, $c67ff3d36836a1c1$exports.globalAllowedDropOperations);
    // Chrome and Safari on macOS will automatically filter effectAllowed when pressing modifier keys,
    // allowing the user to switch between move, link, and copy operations. Firefox on macOS and all
    // Windows browsers do not do this, so do it ourselves instead. The exact keys are platform dependent.
    // https://ux.stackexchange.com/questions/83748/what-are-the-most-common-modifier-keys-for-dragging-objects-with-a-mouse
    //
    // Note that none of these modifiers are ever set in WebKit due to a bug: https://bugs.webkit.org/show_bug.cgi?id=77465
    // However, Safari does update effectAllowed correctly, so we can just rely on that.
    let allowedModifiers = (0, $47f95f5edd0c867d$exports.DROP_OPERATION).none;
    if ((0, $d0b4a781cf26e80b$exports.isMac)()) {
        if (e.altKey) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).copy;
        // Chrome and Safari both use the Control key for link, even though Finder uses Command + Option.
        // iPadOS doesn't support link operations and will not fire the drop event at all if dropEffect is set to link.
        // https://bugs.webkit.org/show_bug.cgi?id=244701
        if (e.ctrlKey && !(0, $d0b4a781cf26e80b$exports.isIPad)()) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).link;
        if (e.metaKey) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).move;
    } else {
        if (e.altKey) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).link;
        if (e.shiftKey) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).move;
        if (e.ctrlKey) allowedModifiers |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION).copy;
    }
    if (allowedModifiers) return allowedOperations & allowedModifiers;
    return allowedOperations;
}
function $c73ae148aea93491$var$allowedOperationsToArray(allowedOperationsBits) {
    let allowedOperations = [];
    if (allowedOperationsBits & (0, $47f95f5edd0c867d$exports.DROP_OPERATION).move) allowedOperations.push('move');
    if (allowedOperationsBits & (0, $47f95f5edd0c867d$exports.DROP_OPERATION).copy) allowedOperations.push('copy');
    if (allowedOperationsBits & (0, $47f95f5edd0c867d$exports.DROP_OPERATION).link) allowedOperations.push('link');
    return allowedOperations;
}
function $c73ae148aea93491$var$getDropOperation(allowedOperations, operation) {
    let op = (0, $47f95f5edd0c867d$exports.DROP_OPERATION)[operation];
    return allowedOperations & op ? operation : 'cancel';
}


//# sourceMappingURL=useDrop.cjs.map
