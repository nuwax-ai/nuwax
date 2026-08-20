import {registerDropTarget as $99f1ee31a7e95d0e$export$c28d9fb4a54e471a} from "./DragManager.mjs";
import {DragTypes as $d40e85a29b831dd6$export$7f04ce188c91447c, globalAllowedDropOperations as $d40e85a29b831dd6$export$f0130eb70b6347b8, globalDndState as $d40e85a29b831dd6$export$6ca6700462636d0b, readFromDataTransfer as $d40e85a29b831dd6$export$d9e760437831f8b3, setGlobalDnDState as $d40e85a29b831dd6$export$6c10d32b362bfa5f, setGlobalDropEffect as $d40e85a29b831dd6$export$64f52ed7349ddb84} from "./utils.mjs";
import {DROP_EFFECT_TO_DROP_OPERATION as $2991e2e71ca29774$export$608ecc6f1b23c35d, DROP_OPERATION as $2991e2e71ca29774$export$60b7b4bcf3903d8e, DROP_OPERATION_ALLOWED as $2991e2e71ca29774$export$9bbdfc78cf083e16, DROP_OPERATION_TO_DROP_EFFECT as $2991e2e71ca29774$export$5eacb0769d26d3b2} from "./constants.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {isIPad as $2add3ce32c6007eb$export$7bef049ce92e4224, isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "../utils/platform.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useVirtualDrop as $8659ad8e5ae1862d$export$62447ad3d2ec7da6} from "./useVirtualDrop.mjs";
import {useState as $58Gka$useState, useRef as $58Gka$useRef} from "react";

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








const $f302ef02e940a6f8$var$DROP_ACTIVATE_TIMEOUT = 800;
function $f302ef02e940a6f8$export$ccdee5eaf73cf661(options) {
    let { hasDropButton: hasDropButton, isDisabled: isDisabled } = options;
    let [isDropTarget, setDropTarget] = (0, $58Gka$useState)(false);
    let state = (0, $58Gka$useRef)({
        x: 0,
        y: 0,
        dragOverElements: new Set(),
        dropEffect: 'none',
        allowedOperations: (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).all,
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
        let allowedOperations = $f302ef02e940a6f8$var$getAllowedOperations(e);
        if (e.clientX === state.x && e.clientY === state.y && allowedOperations === state.allowedOperations) {
            e.dataTransfer.dropEffect = state.dropEffect;
            return;
        }
        state.x = e.clientX;
        state.y = e.clientY;
        let prevDropEffect = state.dropEffect;
        // Update drop effect if allowed drop operations changed (e.g. user pressed modifier key).
        if (allowedOperations !== state.allowedOperations) {
            let allowedOps = $f302ef02e940a6f8$var$allowedOperationsToArray(allowedOperations);
            let dropOperation = allowedOps[0];
            if (typeof options.getDropOperation === 'function') {
                let types = new (0, $d40e85a29b831dd6$export$7f04ce188c91447c)(e.dataTransfer);
                dropOperation = $f302ef02e940a6f8$var$getDropOperation(allowedOperations, options.getDropOperation(types, allowedOps));
            }
            state.dropEffect = (0, $2991e2e71ca29774$export$5eacb0769d26d3b2)[dropOperation] || 'none';
        }
        if (typeof options.getDropOperationForPoint === 'function') {
            let types = new (0, $d40e85a29b831dd6$export$7f04ce188c91447c)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            let dropOperation = $f302ef02e940a6f8$var$getDropOperation(allowedOperations, options.getDropOperationForPoint(types, $f302ef02e940a6f8$var$allowedOperationsToArray(allowedOperations), state.x - rect.x, state.y - rect.y));
            state.dropEffect = (0, $2991e2e71ca29774$export$5eacb0769d26d3b2)[dropOperation] || 'none';
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
            }, $f302ef02e940a6f8$var$DROP_ACTIVATE_TIMEOUT);
        }
    };
    let onDragEnter = (e)=>{
        e.preventDefault();
        e.stopPropagation();
        state.dragOverElements.add((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
        if (state.dragOverElements.size > 1) return;
        let allowedOperationsBits = $f302ef02e940a6f8$var$getAllowedOperations(e);
        let allowedOperations = $f302ef02e940a6f8$var$allowedOperationsToArray(allowedOperationsBits);
        let dropOperation = allowedOperations[0];
        if (typeof options.getDropOperation === 'function') {
            let types = new (0, $d40e85a29b831dd6$export$7f04ce188c91447c)(e.dataTransfer);
            dropOperation = $f302ef02e940a6f8$var$getDropOperation(allowedOperationsBits, options.getDropOperation(types, allowedOperations));
        }
        if (typeof options.getDropOperationForPoint === 'function') {
            let types = new (0, $d40e85a29b831dd6$export$7f04ce188c91447c)(e.dataTransfer);
            let rect = e.currentTarget.getBoundingClientRect();
            dropOperation = $f302ef02e940a6f8$var$getDropOperation(allowedOperationsBits, options.getDropOperationForPoint(types, allowedOperations, e.clientX - rect.x, e.clientY - rect.y));
        }
        state.x = e.clientX;
        state.y = e.clientY;
        state.allowedOperations = allowedOperationsBits;
        state.dropEffect = (0, $2991e2e71ca29774$export$5eacb0769d26d3b2)[dropOperation] || 'none';
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
        let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        state.dragOverElements.delete(target);
        // Only remove stale elements when leaving the drop target itself.
        // Avoids issues with portal children bubbling dragleave events through the React tree.
        if (target === e.currentTarget) {
            for (let element of state.dragOverElements)if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, element)) state.dragOverElements.delete(element);
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
        (0, $d40e85a29b831dd6$export$64f52ed7349ddb84)(state.dropEffect);
        if (typeof options.onDrop === 'function') {
            let dropOperation = (0, $2991e2e71ca29774$export$608ecc6f1b23c35d)[state.dropEffect];
            let items = (0, $d40e85a29b831dd6$export$d9e760437831f8b3)(e.dataTransfer);
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
            ...(0, $d40e85a29b831dd6$export$6ca6700462636d0b)
        };
        state.dragOverElements.clear();
        fireDropExit(e);
        clearTimeout(state.dropActivateTimer);
        // If there wasn't a collection being tracked as a dragged collection, then we are in a case where a non RSP drag is dropped on a
        // RSP collection and thus we don't need to preserve the global drop effect
        if (dndStateSnapshot.draggingCollectionRef == null) (0, $d40e85a29b831dd6$export$64f52ed7349ddb84)(undefined);
        else // Otherwise we need to preserve the global dnd state for onDragEnd's isInternal check.
        // At the moment fireDropExit may clear dropCollectionRef (i.e. useDroppableCollection's provided onDropExit, required to clear dropCollectionRef when exiting a valid drop target)
        (0, $d40e85a29b831dd6$export$6c10d32b362bfa5f)(dndStateSnapshot);
    };
    let onDropEnter = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (typeof options.onDropEnter === 'function') options.onDropEnter(e);
    });
    let onDropExit = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (typeof options.onDropExit === 'function') options.onDropExit(e);
    });
    let onDropActivate = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (typeof options.onDropActivate === 'function') options.onDropActivate(e);
    });
    let onKeyboardDrop = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((e)=>{
        if (typeof options.onDrop === 'function') options.onDrop(e);
    });
    let getDropOperationKeyboard = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)((types, allowedOperations)=>{
        if (options.getDropOperation) return options.getDropOperation(types, allowedOperations);
        return allowedOperations[0];
    });
    let { ref: ref } = options;
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (isDisabled || !ref.current) return;
        return $99f1ee31a7e95d0e$export$c28d9fb4a54e471a({
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
    let { dropProps: dropProps } = (0, $8659ad8e5ae1862d$export$62447ad3d2ec7da6)();
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
function $f302ef02e940a6f8$var$getAllowedOperations(e) {
    let allowedOperations = (0, $2991e2e71ca29774$export$9bbdfc78cf083e16)[e.dataTransfer.effectAllowed];
    // WebKit always sets effectAllowed to "copyMove" on macOS, and "all" on iOS, regardless of what was
    // set during the dragstart event: https://bugs.webkit.org/show_bug.cgi?id=178058
    //
    // Android Chrome also sets effectAllowed to "copyMove" in all cases: https://bugs.chromium.org/p/chromium/issues/detail?id=1359182
    //
    // If the drag started within the page, we can use a global variable to get the real allowed operations.
    // This needs to be intersected with the actual effectAllowed, which may have been filtered based on modifier keys.
    // Unfortunately, this means that link operations do not work at all in Safari.
    if (0, $d40e85a29b831dd6$export$f0130eb70b6347b8) allowedOperations &= (0, $d40e85a29b831dd6$export$f0130eb70b6347b8);
    // Chrome and Safari on macOS will automatically filter effectAllowed when pressing modifier keys,
    // allowing the user to switch between move, link, and copy operations. Firefox on macOS and all
    // Windows browsers do not do this, so do it ourselves instead. The exact keys are platform dependent.
    // https://ux.stackexchange.com/questions/83748/what-are-the-most-common-modifier-keys-for-dragging-objects-with-a-mouse
    //
    // Note that none of these modifiers are ever set in WebKit due to a bug: https://bugs.webkit.org/show_bug.cgi?id=77465
    // However, Safari does update effectAllowed correctly, so we can just rely on that.
    let allowedModifiers = (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).none;
    if ((0, $2add3ce32c6007eb$export$9ac100e40613ea10)()) {
        if (e.altKey) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).copy;
        // Chrome and Safari both use the Control key for link, even though Finder uses Command + Option.
        // iPadOS doesn't support link operations and will not fire the drop event at all if dropEffect is set to link.
        // https://bugs.webkit.org/show_bug.cgi?id=244701
        if (e.ctrlKey && !(0, $2add3ce32c6007eb$export$7bef049ce92e4224)()) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).link;
        if (e.metaKey) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).move;
    } else {
        if (e.altKey) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).link;
        if (e.shiftKey) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).move;
        if (e.ctrlKey) allowedModifiers |= (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).copy;
    }
    if (allowedModifiers) return allowedOperations & allowedModifiers;
    return allowedOperations;
}
function $f302ef02e940a6f8$var$allowedOperationsToArray(allowedOperationsBits) {
    let allowedOperations = [];
    if (allowedOperationsBits & (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).move) allowedOperations.push('move');
    if (allowedOperationsBits & (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).copy) allowedOperations.push('copy');
    if (allowedOperationsBits & (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e).link) allowedOperations.push('link');
    return allowedOperations;
}
function $f302ef02e940a6f8$var$getDropOperation(allowedOperations, operation) {
    let op = (0, $2991e2e71ca29774$export$60b7b4bcf3903d8e)[operation];
    return allowedOperations & op ? operation : 'cancel';
}


export {$f302ef02e940a6f8$export$ccdee5eaf73cf661 as useDrop};
//# sourceMappingURL=useDrop.mjs.map
