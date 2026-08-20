import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import {ariaHideOutside as $20aa6983aa303ce6$export$1c3ebcada18427bf} from "../overlays/ariaHideOutside.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getDragModality as $a279fa400589a731$export$1fb2158d224b542c, getTypes as $a279fa400589a731$export$e1d41611756c6326} from "./utils.js";
import {isVirtualClick as $fa0ef9dfcca012a7$export$60278871457622de, isVirtualPointerEvent as $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63} from "../utils/isVirtualEvent.js";
import {useState as $b7acf$useState, useEffect as $b7acf$useEffect} from "react";

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





let $e1cd17e16f360ff6$var$dropTargets = new Map();
let $e1cd17e16f360ff6$var$dropItems = new Map();
let $e1cd17e16f360ff6$var$dragSession = null;
let $e1cd17e16f360ff6$var$subscriptions = new Set();
function $e1cd17e16f360ff6$export$c28d9fb4a54e471a(target) {
    $e1cd17e16f360ff6$var$dropTargets.set(target.element, target);
    $e1cd17e16f360ff6$var$dragSession === null || $e1cd17e16f360ff6$var$dragSession === void 0 ? void 0 : $e1cd17e16f360ff6$var$dragSession.updateValidDropTargets();
    return ()=>{
        $e1cd17e16f360ff6$var$dropTargets.delete(target.element);
        $e1cd17e16f360ff6$var$dragSession === null || $e1cd17e16f360ff6$var$dragSession === void 0 ? void 0 : $e1cd17e16f360ff6$var$dragSession.updateValidDropTargets();
    };
}
function $e1cd17e16f360ff6$export$aef80212ac99c003(item) {
    $e1cd17e16f360ff6$var$dropItems.set(item.element, item);
    return ()=>{
        $e1cd17e16f360ff6$var$dropItems.delete(item.element);
    };
}
function $e1cd17e16f360ff6$export$549dbcf8649bf3b2(target, stringFormatter) {
    if ($e1cd17e16f360ff6$var$dragSession) throw new Error('Cannot begin dragging while already dragging');
    $e1cd17e16f360ff6$var$dragSession = new $e1cd17e16f360ff6$var$DragSession(target, stringFormatter);
    requestAnimationFrame(()=>{
        if ($e1cd17e16f360ff6$var$dragSession) {
            $e1cd17e16f360ff6$var$dragSession.setup();
            if ((0, $a279fa400589a731$export$1fb2158d224b542c)() === 'keyboard') $e1cd17e16f360ff6$var$dragSession.next();
        }
    });
    for (let cb of $e1cd17e16f360ff6$var$subscriptions)cb();
}
function $e1cd17e16f360ff6$export$418e185dd3f1b968() {
    let [session, setSession] = (0, $b7acf$useState)($e1cd17e16f360ff6$var$dragSession);
    (0, $b7acf$useEffect)(()=>{
        let cb = ()=>setSession($e1cd17e16f360ff6$var$dragSession);
        $e1cd17e16f360ff6$var$subscriptions.add(cb);
        return ()=>{
            $e1cd17e16f360ff6$var$subscriptions.delete(cb);
        };
    }, []);
    return session;
}
function $e1cd17e16f360ff6$export$403bc76cbf68cf60() {
    return !!$e1cd17e16f360ff6$var$dragSession;
}
function $e1cd17e16f360ff6$var$endDragging() {
    $e1cd17e16f360ff6$var$dragSession = null;
    for (let cb of $e1cd17e16f360ff6$var$subscriptions)cb();
}
function $e1cd17e16f360ff6$export$7454aff2e161f241(element) {
    for (let target of $e1cd17e16f360ff6$var$dropTargets.keys()){
        if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(target, element)) return true;
    }
    return false;
}
const $e1cd17e16f360ff6$var$CANCELED_EVENTS = [
    'pointerdown',
    'pointermove',
    'pointerenter',
    'pointerleave',
    'pointerover',
    'pointerout',
    'pointerup',
    'mousedown',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'mouseover',
    'mouseout',
    'mouseup',
    'touchstart',
    'touchmove',
    'touchend',
    'focusin',
    'focusout'
];
const $e1cd17e16f360ff6$var$CLICK_EVENTS = [
    'pointerup',
    'mouseup',
    'touchend'
];
const $e1cd17e16f360ff6$var$MESSAGES = {
    keyboard: 'dragStartedKeyboard',
    touch: 'dragStartedTouch',
    virtual: 'dragStartedVirtual'
};
class $e1cd17e16f360ff6$var$DragSession {
    setup() {
        document.addEventListener('keydown', this.onKeyDown, true);
        document.addEventListener('keyup', this.onKeyUp, true);
        window.addEventListener('focus', this.onFocus, true);
        window.addEventListener('blur', this.onBlur, true);
        document.addEventListener('click', this.onClick, true);
        document.addEventListener('pointerdown', this.onPointerDown, true);
        for (let event of $e1cd17e16f360ff6$var$CANCELED_EVENTS)document.addEventListener(event, this.cancelEvent, true);
        this.mutationObserver = new MutationObserver(()=>this.updateValidDropTargets());
        this.updateValidDropTargets();
        (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(this.stringFormatter.format($e1cd17e16f360ff6$var$MESSAGES[(0, $a279fa400589a731$export$1fb2158d224b542c)()]));
    }
    teardown() {
        var _this_mutationObserver, _this_restoreAriaHidden, _this;
        document.removeEventListener('keydown', this.onKeyDown, true);
        document.removeEventListener('keyup', this.onKeyUp, true);
        window.removeEventListener('focus', this.onFocus, true);
        window.removeEventListener('blur', this.onBlur, true);
        document.removeEventListener('click', this.onClick, true);
        document.removeEventListener('pointerdown', this.onPointerDown, true);
        for (let event of $e1cd17e16f360ff6$var$CANCELED_EVENTS)document.removeEventListener(event, this.cancelEvent, true);
        (_this_mutationObserver = this.mutationObserver) === null || _this_mutationObserver === void 0 ? void 0 : _this_mutationObserver.disconnect();
        (_this_restoreAriaHidden = (_this = this).restoreAriaHidden) === null || _this_restoreAriaHidden === void 0 ? void 0 : _this_restoreAriaHidden.call(_this);
    }
    onKeyDown(e) {
        var _this_currentDropTarget;
        this.cancelEvent(e);
        if (e.key === 'Escape') {
            this.cancel();
            return;
        }
        if (e.key === 'Tab' && !(e.metaKey || e.altKey || e.ctrlKey)) {
            if (e.shiftKey) this.previous();
            else this.next();
        }
        if (typeof ((_this_currentDropTarget = this.currentDropTarget) === null || _this_currentDropTarget === void 0 ? void 0 : _this_currentDropTarget.onKeyDown) === 'function') this.currentDropTarget.onKeyDown(e, this.dragTarget);
    }
    onKeyUp(e) {
        this.cancelEvent(e);
        if (e.key === 'Enter') {
            if (e.altKey || (0, $d8ac7ed472840322$export$4282f70798064fe0)(this.getCurrentActivateButton(), (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) this.activate(this.currentDropTarget, this.currentDropItem);
            else this.drop();
        }
    }
    getCurrentActivateButton() {
        var _this_currentDropItem_activateButtonRef, _this_currentDropItem, _this_currentDropTarget_activateButtonRef, _this_currentDropTarget;
        var _this_currentDropItem_activateButtonRef_current, _ref;
        return (_ref = (_this_currentDropItem_activateButtonRef_current = (_this_currentDropItem = this.currentDropItem) === null || _this_currentDropItem === void 0 ? void 0 : (_this_currentDropItem_activateButtonRef = _this_currentDropItem.activateButtonRef) === null || _this_currentDropItem_activateButtonRef === void 0 ? void 0 : _this_currentDropItem_activateButtonRef.current) !== null && _this_currentDropItem_activateButtonRef_current !== void 0 ? _this_currentDropItem_activateButtonRef_current : (_this_currentDropTarget = this.currentDropTarget) === null || _this_currentDropTarget === void 0 ? void 0 : (_this_currentDropTarget_activateButtonRef = _this_currentDropTarget.activateButtonRef) === null || _this_currentDropTarget_activateButtonRef === void 0 ? void 0 : _this_currentDropTarget_activateButtonRef.current) !== null && _ref !== void 0 ? _ref : null;
    }
    onFocus(e) {
        let activateButton = this.getCurrentActivateButton();
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (eventTarget === activateButton) {
            // TODO: canceling this breaks the focus ring. Revisit when we support tabbing.
            this.cancelEvent(e);
            return;
        }
        // Prevent focus events, except to the original drag target.
        if (eventTarget !== this.dragTarget.element) this.cancelEvent(e);
        // Ignore focus events on the window/document (JSDOM). Will be handled in onBlur, below.
        if (!(eventTarget instanceof HTMLElement) || eventTarget === this.dragTarget.element) return;
        let dropTarget = this.validDropTargets.find((target)=>target.element === eventTarget) || this.validDropTargets.find((target)=>(0, $d8ac7ed472840322$export$4282f70798064fe0)(target.element, eventTarget));
        if (!dropTarget) {
            // if (e.target === activateButton) {
            //   activateButton.focus();
            // }
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
            return;
        }
        let item = $e1cd17e16f360ff6$var$dropItems.get(eventTarget);
        if (dropTarget) this.setCurrentDropTarget(dropTarget, item);
    }
    onBlur(e) {
        let activateButton = this.getCurrentActivateButton();
        if (e.relatedTarget === activateButton) {
            this.cancelEvent(e);
            return;
        }
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) !== this.dragTarget.element) this.cancelEvent(e);
        // If nothing is gaining focus, or e.relatedTarget is the window/document (JSDOM),
        // restore focus back to the current drop target if any, or the original drag target.
        if (!e.relatedTarget || !(e.relatedTarget instanceof HTMLElement)) {
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
        }
    }
    onClick(e) {
        this.cancelEvent(e);
        if ((0, $fa0ef9dfcca012a7$export$60278871457622de)(e) || this.isVirtualClick) {
            var _item_activateButtonRef, _dropTarget_activateButtonRef;
            let dropElements = $e1cd17e16f360ff6$var$dropItems.values();
            let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
            let item = [
                ...dropElements
            ].find((item)=>{
                var _item_activateButtonRef;
                return item.element === eventTarget || (0, $d8ac7ed472840322$export$4282f70798064fe0)((_item_activateButtonRef = item.activateButtonRef) === null || _item_activateButtonRef === void 0 ? void 0 : _item_activateButtonRef.current, eventTarget);
            });
            let dropTarget = this.validDropTargets.find((target)=>(0, $d8ac7ed472840322$export$4282f70798064fe0)(target.element, eventTarget));
            var _item_activateButtonRef_current;
            let activateButton = (_item_activateButtonRef_current = item === null || item === void 0 ? void 0 : (_item_activateButtonRef = item.activateButtonRef) === null || _item_activateButtonRef === void 0 ? void 0 : _item_activateButtonRef.current) !== null && _item_activateButtonRef_current !== void 0 ? _item_activateButtonRef_current : dropTarget === null || dropTarget === void 0 ? void 0 : (_dropTarget_activateButtonRef = dropTarget.activateButtonRef) === null || _dropTarget_activateButtonRef === void 0 ? void 0 : _dropTarget_activateButtonRef.current;
            if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(activateButton, eventTarget) && dropTarget) {
                this.activate(dropTarget, item);
                return;
            }
            if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === this.dragTarget.element) {
                this.cancel();
                return;
            }
            if (dropTarget) {
                this.setCurrentDropTarget(dropTarget, item);
                this.drop(item);
            }
        }
    }
    onPointerDown(e) {
        // Android Talkback double tap has e.detail = 1 for onClick. Detect the virtual click in onPointerDown before onClick fires
        // so we can properly perform cancel and drop operations.
        this.cancelEvent(e);
        this.isVirtualClick = (0, $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63)(e);
    }
    cancelEvent(e) {
        var _this_dragTarget;
        // Allow focusin and focusout on the drag target so focus ring works properly.
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if ((e.type === 'focusin' || e.type === 'focusout') && (eventTarget === ((_this_dragTarget = this.dragTarget) === null || _this_dragTarget === void 0 ? void 0 : _this_dragTarget.element) || eventTarget === this.getCurrentActivateButton())) return;
        // Allow default for events that might cancel a click event
        if (!$e1cd17e16f360ff6$var$CLICK_EVENTS.includes(e.type)) e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    updateValidDropTargets() {
        if (!this.mutationObserver) return;
        this.mutationObserver.disconnect();
        if (this.restoreAriaHidden) this.restoreAriaHidden();
        this.validDropTargets = $e1cd17e16f360ff6$var$findValidDropTargets(this.dragTarget);
        // Shuffle drop target order based on starting drag target.
        if (this.validDropTargets.length > 0) {
            let nearestIndex = this.findNearestDropTarget();
            this.validDropTargets = [
                ...this.validDropTargets.slice(nearestIndex),
                ...this.validDropTargets.slice(0, nearestIndex)
            ];
        }
        if (this.currentDropTarget && !this.validDropTargets.includes(this.currentDropTarget)) this.setCurrentDropTarget(this.validDropTargets[0]);
        // Find valid drop items within collections
        let types = (0, $a279fa400589a731$export$e1d41611756c6326)(this.dragTarget.items);
        let validDropItems = [
            ...$e1cd17e16f360ff6$var$dropItems.values()
        ].filter((item)=>{
            if (typeof item.getDropOperation === 'function') return item.getDropOperation(types, this.dragTarget.allowedDropOperations) !== 'cancel';
            return true;
        });
        // Filter out drop targets that contain valid items. We don't want to stop hiding elements
        // other than the drop items that exist inside the collection.
        let visibleDropTargets = this.validDropTargets.filter((target)=>!validDropItems.some((item)=>(0, $d8ac7ed472840322$export$4282f70798064fe0)(target.element, item.element)));
        this.restoreAriaHidden = (0, $20aa6983aa303ce6$export$1c3ebcada18427bf)([
            this.dragTarget.element,
            ...validDropItems.flatMap((item)=>{
                var _item_activateButtonRef, _item_activateButtonRef1;
                return ((_item_activateButtonRef = item.activateButtonRef) === null || _item_activateButtonRef === void 0 ? void 0 : _item_activateButtonRef.current) ? [
                    item.element,
                    (_item_activateButtonRef1 = item.activateButtonRef) === null || _item_activateButtonRef1 === void 0 ? void 0 : _item_activateButtonRef1.current
                ] : [
                    item.element
                ];
            }),
            ...visibleDropTargets.flatMap((target)=>{
                var _target_activateButtonRef, _target_activateButtonRef1;
                return ((_target_activateButtonRef = target.activateButtonRef) === null || _target_activateButtonRef === void 0 ? void 0 : _target_activateButtonRef.current) ? [
                    target.element,
                    (_target_activateButtonRef1 = target.activateButtonRef) === null || _target_activateButtonRef1 === void 0 ? void 0 : _target_activateButtonRef1.current
                ] : [
                    target.element
                ];
            })
        ], {
            shouldUseInert: true
        });
        this.mutationObserver.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: [
                'aria-hidden',
                'inert'
            ]
        });
    }
    next() {
        // TODO: Allow tabbing to the activate button. Revisit once we fix the focus ring.
        // For now, the activate button is reachable by screen readers and ArrowLeft/ArrowRight
        // is usable specifically by Tree. Will need tabbing for other components.
        // let activateButton = this.getCurrentActivateButton();
        // if (activateButton && document.activeElement !== activateButton) {
        //   activateButton.focus();
        //   return;
        // }
        if (!this.currentDropTarget) {
            this.setCurrentDropTarget(this.validDropTargets[0]);
            return;
        }
        let index = this.validDropTargets.indexOf(this.currentDropTarget);
        if (index < 0) {
            this.setCurrentDropTarget(this.validDropTargets[0]);
            return;
        }
        // If we've reached the end of the valid drop targets, cycle back to the original drag target.
        // This lets the user cancel the drag in case they don't have an Escape key (e.g. iPad keyboard case).
        if (index === this.validDropTargets.length - 1) {
            if (!this.dragTarget.element.closest('[aria-hidden="true"], [inert]')) {
                this.setCurrentDropTarget(null);
                this.dragTarget.element.focus();
            } else this.setCurrentDropTarget(this.validDropTargets[0]);
        } else this.setCurrentDropTarget(this.validDropTargets[index + 1]);
    }
    previous() {
        // let activateButton = this.getCurrentActivateButton();
        // if (activateButton && document.activeElement === activateButton) {
        //   let target = this.currentDropItem ?? this.currentDropTarget;
        //   if (target) {
        //     target.element.focus();
        //     return;
        //   }
        // }
        if (!this.currentDropTarget) {
            this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
            return;
        }
        let index = this.validDropTargets.indexOf(this.currentDropTarget);
        if (index < 0) {
            this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
            return;
        }
        // If we've reached the start of the valid drop targets, cycle back to the original drag target.
        // This lets the user cancel the drag in case they don't have an Escape key (e.g. iPad keyboard case).
        if (index === 0) {
            if (!this.dragTarget.element.closest('[aria-hidden="true"], [inert]')) {
                this.setCurrentDropTarget(null);
                this.dragTarget.element.focus();
            } else this.setCurrentDropTarget(this.validDropTargets[this.validDropTargets.length - 1]);
        } else this.setCurrentDropTarget(this.validDropTargets[index - 1]);
    }
    findNearestDropTarget() {
        let dragTargetRect = this.dragTarget.element.getBoundingClientRect();
        let minDistance = Infinity;
        let nearest = -1;
        for(let i = 0; i < this.validDropTargets.length; i++){
            let dropTarget = this.validDropTargets[i];
            let rect = dropTarget.element.getBoundingClientRect();
            let dx = rect.left - dragTargetRect.left;
            let dy = rect.top - dragTargetRect.top;
            let dist = dx * dx + dy * dy;
            if (dist < minDistance) {
                minDistance = dist;
                nearest = i;
            }
        }
        return nearest;
    }
    setCurrentDropTarget(dropTarget, item) {
        if (dropTarget !== this.currentDropTarget) {
            if (this.currentDropTarget && typeof this.currentDropTarget.onDropExit === 'function') {
                let rect = this.currentDropTarget.element.getBoundingClientRect();
                this.currentDropTarget.onDropExit({
                    type: 'dropexit',
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            }
            this.currentDropTarget = dropTarget;
            if (dropTarget) {
                if (typeof dropTarget.onDropEnter === 'function') {
                    let rect = dropTarget.element.getBoundingClientRect();
                    dropTarget.onDropEnter({
                        type: 'dropenter',
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2
                    }, this.dragTarget);
                }
                if (!item) dropTarget === null || dropTarget === void 0 ? void 0 : dropTarget.element.focus();
            }
        }
        if (item != null && item !== this.currentDropItem) {
            if (this.currentDropTarget && typeof this.currentDropTarget.onDropTargetEnter === 'function') this.currentDropTarget.onDropTargetEnter(item.target);
            item.element.focus();
            this.currentDropItem = item;
            // Announce first drop target after drag start announcement finishes.
            // Otherwise, it will never get announced because drag start announcement is assertive.
            if (!this.initialFocused) {
                let label = item === null || item === void 0 ? void 0 : item.element.getAttribute('aria-label');
                if (label) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(label, 'polite');
                this.initialFocused = true;
            }
        }
    }
    end() {
        var // Re-trigger focus event on active element, since it will not have received it during dragging (see cancelEvent).
        // This corrects state such as whether focus ring should appear.
        // useDroppableCollection handles this itself, so this is only for standalone drop zones.
        _getActiveElement;
        this.teardown();
        $e1cd17e16f360ff6$var$endDragging();
        if (typeof this.dragTarget.onDragEnd === 'function') {
            let target = this.currentDropTarget && this.dropOperation !== 'cancel' ? this.currentDropTarget : this.dragTarget;
            let rect = target.element.getBoundingClientRect();
            this.dragTarget.onDragEnd({
                type: 'dragend',
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                dropOperation: this.dropOperation || 'cancel'
            });
        }
        if (this.currentDropTarget && !this.currentDropTarget.preventFocusOnDrop) (_getActiveElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)()) === null || _getActiveElement === void 0 ? void 0 : _getActiveElement.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        this.setCurrentDropTarget(null);
    }
    cancel() {
        var // Re-trigger focus event on active element, since it will not have received it during dragging (see cancelEvent).
        _getActiveElement;
        this.setCurrentDropTarget(null);
        this.end();
        if (!this.dragTarget.element.closest('[aria-hidden="true"], [inert]')) this.dragTarget.element.focus();
        (_getActiveElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)()) === null || _getActiveElement === void 0 ? void 0 : _getActiveElement.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(this.stringFormatter.format('dropCanceled'));
    }
    drop(item) {
        if (!this.currentDropTarget) {
            this.cancel();
            return;
        }
        if (typeof (item === null || item === void 0 ? void 0 : item.getDropOperation) === 'function') {
            let types = (0, $a279fa400589a731$export$e1d41611756c6326)(this.dragTarget.items);
            this.dropOperation = item.getDropOperation(types, this.dragTarget.allowedDropOperations);
        } else if (typeof this.currentDropTarget.getDropOperation === 'function') {
            let types = (0, $a279fa400589a731$export$e1d41611756c6326)(this.dragTarget.items);
            this.dropOperation = this.currentDropTarget.getDropOperation(types, this.dragTarget.allowedDropOperations);
        } else // TODO: show menu ??
        this.dropOperation = this.dragTarget.allowedDropOperations[0];
        if (typeof this.currentDropTarget.onDrop === 'function') {
            let items = this.dragTarget.items.map((item)=>({
                    kind: 'text',
                    types: new Set(Object.keys(item)),
                    getText: (type)=>Promise.resolve(item[type])
                }));
            let rect = this.currentDropTarget.element.getBoundingClientRect();
            var _item_target;
            this.currentDropTarget.onDrop({
                type: 'drop',
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                items: items,
                dropOperation: this.dropOperation
            }, (_item_target = item === null || item === void 0 ? void 0 : item.target) !== null && _item_target !== void 0 ? _item_target : null);
        }
        this.end();
        (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(this.stringFormatter.format('dropComplete'));
    }
    activate(dropTarget, dropItem) {
        if (dropTarget && typeof dropTarget.onDropActivate === 'function') {
            var _dropItem_target;
            let target = (_dropItem_target = dropItem === null || dropItem === void 0 ? void 0 : dropItem.target) !== null && _dropItem_target !== void 0 ? _dropItem_target : null;
            let rect = dropTarget.element.getBoundingClientRect();
            dropTarget.onDropActivate({
                type: 'dropactivate',
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            }, target);
        }
    }
    constructor(target, stringFormatter){
        this.validDropTargets = [];
        this.currentDropTarget = null;
        this.currentDropItem = null;
        this.dropOperation = null;
        this.mutationObserver = null;
        this.restoreAriaHidden = null;
        this.isVirtualClick = false;
        this.dragTarget = target;
        this.stringFormatter = stringFormatter;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.cancelEvent = this.cancelEvent.bind(this);
        this.initialFocused = false;
    }
}
function $e1cd17e16f360ff6$var$findValidDropTargets(options) {
    let types = (0, $a279fa400589a731$export$e1d41611756c6326)(options.items);
    return [
        ...$e1cd17e16f360ff6$var$dropTargets.values()
    ].filter((target)=>{
        if (target.element.closest('[aria-hidden="true"], [inert]')) return false;
        if (typeof target.getDropOperation === 'function') return target.getDropOperation(types, options.allowedDropOperations) !== 'cancel';
        return true;
    });
}


export {$e1cd17e16f360ff6$export$c28d9fb4a54e471a as registerDropTarget, $e1cd17e16f360ff6$export$aef80212ac99c003 as registerDropItem, $e1cd17e16f360ff6$export$549dbcf8649bf3b2 as beginDragging, $e1cd17e16f360ff6$export$418e185dd3f1b968 as useDragSession, $e1cd17e16f360ff6$export$403bc76cbf68cf60 as isVirtualDragging, $e1cd17e16f360ff6$export$7454aff2e161f241 as isValidDropTarget};
//# sourceMappingURL=DragManager.js.map
