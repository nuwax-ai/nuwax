import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import {ariaHideOutside as $58196c8d6a1f38fc$export$1c3ebcada18427bf} from "../overlays/ariaHideOutside.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getDragModality as $d40e85a29b831dd6$export$1fb2158d224b542c, getTypes as $d40e85a29b831dd6$export$e1d41611756c6326} from "./utils.mjs";
import {isVirtualClick as $b5c62b033c25b96d$export$60278871457622de, isVirtualPointerEvent as $b5c62b033c25b96d$export$29bf1b5f2c56cf63} from "../utils/isVirtualEvent.mjs";
import {useState as $3R3zh$useState, useEffect as $3R3zh$useEffect} from "react";

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





let $99f1ee31a7e95d0e$var$dropTargets = new Map();
let $99f1ee31a7e95d0e$var$dropItems = new Map();
let $99f1ee31a7e95d0e$var$dragSession = null;
let $99f1ee31a7e95d0e$var$subscriptions = new Set();
function $99f1ee31a7e95d0e$export$c28d9fb4a54e471a(target) {
    $99f1ee31a7e95d0e$var$dropTargets.set(target.element, target);
    $99f1ee31a7e95d0e$var$dragSession?.updateValidDropTargets();
    return ()=>{
        $99f1ee31a7e95d0e$var$dropTargets.delete(target.element);
        $99f1ee31a7e95d0e$var$dragSession?.updateValidDropTargets();
    };
}
function $99f1ee31a7e95d0e$export$aef80212ac99c003(item) {
    $99f1ee31a7e95d0e$var$dropItems.set(item.element, item);
    return ()=>{
        $99f1ee31a7e95d0e$var$dropItems.delete(item.element);
    };
}
function $99f1ee31a7e95d0e$export$549dbcf8649bf3b2(target, stringFormatter) {
    if ($99f1ee31a7e95d0e$var$dragSession) throw new Error('Cannot begin dragging while already dragging');
    $99f1ee31a7e95d0e$var$dragSession = new $99f1ee31a7e95d0e$var$DragSession(target, stringFormatter);
    requestAnimationFrame(()=>{
        if ($99f1ee31a7e95d0e$var$dragSession) {
            $99f1ee31a7e95d0e$var$dragSession.setup();
            if ((0, $d40e85a29b831dd6$export$1fb2158d224b542c)() === 'keyboard') $99f1ee31a7e95d0e$var$dragSession.next();
        }
    });
    for (let cb of $99f1ee31a7e95d0e$var$subscriptions)cb();
}
function $99f1ee31a7e95d0e$export$418e185dd3f1b968() {
    let [session, setSession] = (0, $3R3zh$useState)($99f1ee31a7e95d0e$var$dragSession);
    (0, $3R3zh$useEffect)(()=>{
        let cb = ()=>setSession($99f1ee31a7e95d0e$var$dragSession);
        $99f1ee31a7e95d0e$var$subscriptions.add(cb);
        return ()=>{
            $99f1ee31a7e95d0e$var$subscriptions.delete(cb);
        };
    }, []);
    return session;
}
function $99f1ee31a7e95d0e$export$403bc76cbf68cf60() {
    return !!$99f1ee31a7e95d0e$var$dragSession;
}
function $99f1ee31a7e95d0e$var$endDragging() {
    $99f1ee31a7e95d0e$var$dragSession = null;
    for (let cb of $99f1ee31a7e95d0e$var$subscriptions)cb();
}
function $99f1ee31a7e95d0e$export$7454aff2e161f241(element) {
    for (let target of $99f1ee31a7e95d0e$var$dropTargets.keys()){
        if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(target, element)) return true;
    }
    return false;
}
const $99f1ee31a7e95d0e$var$CANCELED_EVENTS = [
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
const $99f1ee31a7e95d0e$var$CLICK_EVENTS = [
    'pointerup',
    'mouseup',
    'touchend'
];
const $99f1ee31a7e95d0e$var$MESSAGES = {
    keyboard: 'dragStartedKeyboard',
    touch: 'dragStartedTouch',
    virtual: 'dragStartedVirtual'
};
class $99f1ee31a7e95d0e$var$DragSession {
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
    setup() {
        document.addEventListener('keydown', this.onKeyDown, true);
        document.addEventListener('keyup', this.onKeyUp, true);
        window.addEventListener('focus', this.onFocus, true);
        window.addEventListener('blur', this.onBlur, true);
        document.addEventListener('click', this.onClick, true);
        document.addEventListener('pointerdown', this.onPointerDown, true);
        for (let event of $99f1ee31a7e95d0e$var$CANCELED_EVENTS)document.addEventListener(event, this.cancelEvent, true);
        this.mutationObserver = new MutationObserver(()=>this.updateValidDropTargets());
        this.updateValidDropTargets();
        (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(this.stringFormatter.format($99f1ee31a7e95d0e$var$MESSAGES[(0, $d40e85a29b831dd6$export$1fb2158d224b542c)()]));
    }
    teardown() {
        document.removeEventListener('keydown', this.onKeyDown, true);
        document.removeEventListener('keyup', this.onKeyUp, true);
        window.removeEventListener('focus', this.onFocus, true);
        window.removeEventListener('blur', this.onBlur, true);
        document.removeEventListener('click', this.onClick, true);
        document.removeEventListener('pointerdown', this.onPointerDown, true);
        for (let event of $99f1ee31a7e95d0e$var$CANCELED_EVENTS)document.removeEventListener(event, this.cancelEvent, true);
        this.mutationObserver?.disconnect();
        this.restoreAriaHidden?.();
    }
    onKeyDown(e) {
        this.cancelEvent(e);
        if (e.key === 'Escape') {
            this.cancel();
            return;
        }
        if (e.key === 'Tab' && !(e.metaKey || e.altKey || e.ctrlKey)) {
            if (e.shiftKey) this.previous();
            else this.next();
        }
        if (typeof this.currentDropTarget?.onKeyDown === 'function') this.currentDropTarget.onKeyDown(e, this.dragTarget);
    }
    onKeyUp(e) {
        this.cancelEvent(e);
        if (e.key === 'Enter') {
            if (e.altKey || (0, $23f2114a1b82827e$export$4282f70798064fe0)(this.getCurrentActivateButton(), (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) this.activate(this.currentDropTarget, this.currentDropItem);
            else this.drop();
        }
    }
    getCurrentActivateButton() {
        return this.currentDropItem?.activateButtonRef?.current ?? this.currentDropTarget?.activateButtonRef?.current ?? null;
    }
    onFocus(e) {
        let activateButton = this.getCurrentActivateButton();
        let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        if (eventTarget === activateButton) {
            // TODO: canceling this breaks the focus ring. Revisit when we support tabbing.
            this.cancelEvent(e);
            return;
        }
        // Prevent focus events, except to the original drag target.
        if (eventTarget !== this.dragTarget.element) this.cancelEvent(e);
        // Ignore focus events on the window/document (JSDOM). Will be handled in onBlur, below.
        if (!(eventTarget instanceof HTMLElement) || eventTarget === this.dragTarget.element) return;
        let dropTarget = this.validDropTargets.find((target)=>target.element === eventTarget) || this.validDropTargets.find((target)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(target.element, eventTarget));
        if (!dropTarget) {
            // if (e.target === activateButton) {
            //   activateButton.focus();
            // }
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
            return;
        }
        let item = $99f1ee31a7e95d0e$var$dropItems.get(eventTarget);
        if (dropTarget) this.setCurrentDropTarget(dropTarget, item);
    }
    onBlur(e) {
        let activateButton = this.getCurrentActivateButton();
        if (e.relatedTarget === activateButton) {
            this.cancelEvent(e);
            return;
        }
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) !== this.dragTarget.element) this.cancelEvent(e);
        // If nothing is gaining focus, or e.relatedTarget is the window/document (JSDOM),
        // restore focus back to the current drop target if any, or the original drag target.
        if (!e.relatedTarget || !(e.relatedTarget instanceof HTMLElement)) {
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
        }
    }
    onClick(e) {
        this.cancelEvent(e);
        if ((0, $b5c62b033c25b96d$export$60278871457622de)(e) || this.isVirtualClick) {
            let dropElements = $99f1ee31a7e95d0e$var$dropItems.values();
            let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
            let item = [
                ...dropElements
            ].find((item)=>item.element === eventTarget || (0, $23f2114a1b82827e$export$4282f70798064fe0)(item.activateButtonRef?.current, eventTarget));
            let dropTarget = this.validDropTargets.find((target)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(target.element, eventTarget));
            let activateButton = item?.activateButtonRef?.current ?? dropTarget?.activateButtonRef?.current;
            if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(activateButton, eventTarget) && dropTarget) {
                this.activate(dropTarget, item);
                return;
            }
            if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) === this.dragTarget.element) {
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
        this.isVirtualClick = (0, $b5c62b033c25b96d$export$29bf1b5f2c56cf63)(e);
    }
    cancelEvent(e) {
        // Allow focusin and focusout on the drag target so focus ring works properly.
        let eventTarget = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        if ((e.type === 'focusin' || e.type === 'focusout') && (eventTarget === this.dragTarget?.element || eventTarget === this.getCurrentActivateButton())) return;
        // Allow default for events that might cancel a click event
        if (!$99f1ee31a7e95d0e$var$CLICK_EVENTS.includes(e.type)) e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    updateValidDropTargets() {
        if (!this.mutationObserver) return;
        this.mutationObserver.disconnect();
        if (this.restoreAriaHidden) this.restoreAriaHidden();
        this.validDropTargets = $99f1ee31a7e95d0e$var$findValidDropTargets(this.dragTarget);
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
        let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(this.dragTarget.items);
        let validDropItems = [
            ...$99f1ee31a7e95d0e$var$dropItems.values()
        ].filter((item)=>{
            if (typeof item.getDropOperation === 'function') return item.getDropOperation(types, this.dragTarget.allowedDropOperations) !== 'cancel';
            return true;
        });
        // Filter out drop targets that contain valid items. We don't want to stop hiding elements
        // other than the drop items that exist inside the collection.
        let visibleDropTargets = this.validDropTargets.filter((target)=>!validDropItems.some((item)=>(0, $23f2114a1b82827e$export$4282f70798064fe0)(target.element, item.element)));
        this.restoreAriaHidden = (0, $58196c8d6a1f38fc$export$1c3ebcada18427bf)([
            this.dragTarget.element,
            ...validDropItems.flatMap((item)=>item.activateButtonRef?.current ? [
                    item.element,
                    item.activateButtonRef?.current
                ] : [
                    item.element
                ]),
            ...visibleDropTargets.flatMap((target)=>target.activateButtonRef?.current ? [
                    target.element,
                    target.activateButtonRef?.current
                ] : [
                    target.element
                ])
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
                if (!item) dropTarget?.element.focus();
            }
        }
        if (item != null && item !== this.currentDropItem) {
            if (this.currentDropTarget && typeof this.currentDropTarget.onDropTargetEnter === 'function') this.currentDropTarget.onDropTargetEnter(item.target);
            item.element.focus();
            this.currentDropItem = item;
            // Announce first drop target after drag start announcement finishes.
            // Otherwise, it will never get announced because drag start announcement is assertive.
            if (!this.initialFocused) {
                let label = item?.element.getAttribute('aria-label');
                if (label) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(label, 'polite');
                this.initialFocused = true;
            }
        }
    }
    end() {
        this.teardown();
        $99f1ee31a7e95d0e$var$endDragging();
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
        if (this.currentDropTarget && !this.currentDropTarget.preventFocusOnDrop) // Re-trigger focus event on active element, since it will not have received it during dragging (see cancelEvent).
        // This corrects state such as whether focus ring should appear.
        // useDroppableCollection handles this itself, so this is only for standalone drop zones.
        (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)()?.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        this.setCurrentDropTarget(null);
    }
    cancel() {
        this.setCurrentDropTarget(null);
        this.end();
        if (!this.dragTarget.element.closest('[aria-hidden="true"], [inert]')) this.dragTarget.element.focus();
        // Re-trigger focus event on active element, since it will not have received it during dragging (see cancelEvent).
        (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)()?.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(this.stringFormatter.format('dropCanceled'));
    }
    drop(item) {
        if (!this.currentDropTarget) {
            this.cancel();
            return;
        }
        if (typeof item?.getDropOperation === 'function') {
            let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(this.dragTarget.items);
            this.dropOperation = item.getDropOperation(types, this.dragTarget.allowedDropOperations);
        } else if (typeof this.currentDropTarget.getDropOperation === 'function') {
            let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(this.dragTarget.items);
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
            this.currentDropTarget.onDrop({
                type: 'drop',
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                items: items,
                dropOperation: this.dropOperation
            }, item?.target ?? null);
        }
        this.end();
        (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(this.stringFormatter.format('dropComplete'));
    }
    activate(dropTarget, dropItem) {
        if (dropTarget && typeof dropTarget.onDropActivate === 'function') {
            let target = dropItem?.target ?? null;
            let rect = dropTarget.element.getBoundingClientRect();
            dropTarget.onDropActivate({
                type: 'dropactivate',
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            }, target);
        }
    }
}
function $99f1ee31a7e95d0e$var$findValidDropTargets(options) {
    let types = (0, $d40e85a29b831dd6$export$e1d41611756c6326)(options.items);
    return [
        ...$99f1ee31a7e95d0e$var$dropTargets.values()
    ].filter((target)=>{
        if (target.element.closest('[aria-hidden="true"], [inert]')) return false;
        if (typeof target.getDropOperation === 'function') return target.getDropOperation(types, options.allowedDropOperations) !== 'cancel';
        return true;
    });
}


export {$99f1ee31a7e95d0e$export$c28d9fb4a54e471a as registerDropTarget, $99f1ee31a7e95d0e$export$aef80212ac99c003 as registerDropItem, $99f1ee31a7e95d0e$export$549dbcf8649bf3b2 as beginDragging, $99f1ee31a7e95d0e$export$418e185dd3f1b968 as useDragSession, $99f1ee31a7e95d0e$export$403bc76cbf68cf60 as isVirtualDragging, $99f1ee31a7e95d0e$export$7454aff2e161f241 as isValidDropTarget};
//# sourceMappingURL=DragManager.mjs.map
