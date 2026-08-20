var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $3c73045d61be2d91$exports = require("../overlays/ariaHideOutside.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $8f130d4aeb0f65e8$exports = require("../utils/isVirtualEvent.cjs");
var $k30U5$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "registerDropTarget", function () { return $7394b2797bc2343d$export$c28d9fb4a54e471a; });
$parcel$export(module.exports, "registerDropItem", function () { return $7394b2797bc2343d$export$aef80212ac99c003; });
$parcel$export(module.exports, "beginDragging", function () { return $7394b2797bc2343d$export$549dbcf8649bf3b2; });
$parcel$export(module.exports, "useDragSession", function () { return $7394b2797bc2343d$export$418e185dd3f1b968; });
$parcel$export(module.exports, "isVirtualDragging", function () { return $7394b2797bc2343d$export$403bc76cbf68cf60; });
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





let $7394b2797bc2343d$var$dropTargets = new Map();
let $7394b2797bc2343d$var$dropItems = new Map();
let $7394b2797bc2343d$var$dragSession = null;
let $7394b2797bc2343d$var$subscriptions = new Set();
function $7394b2797bc2343d$export$c28d9fb4a54e471a(target) {
    $7394b2797bc2343d$var$dropTargets.set(target.element, target);
    $7394b2797bc2343d$var$dragSession?.updateValidDropTargets();
    return ()=>{
        $7394b2797bc2343d$var$dropTargets.delete(target.element);
        $7394b2797bc2343d$var$dragSession?.updateValidDropTargets();
    };
}
function $7394b2797bc2343d$export$aef80212ac99c003(item) {
    $7394b2797bc2343d$var$dropItems.set(item.element, item);
    return ()=>{
        $7394b2797bc2343d$var$dropItems.delete(item.element);
    };
}
function $7394b2797bc2343d$export$549dbcf8649bf3b2(target, stringFormatter) {
    if ($7394b2797bc2343d$var$dragSession) throw new Error('Cannot begin dragging while already dragging');
    $7394b2797bc2343d$var$dragSession = new $7394b2797bc2343d$var$DragSession(target, stringFormatter);
    requestAnimationFrame(()=>{
        if ($7394b2797bc2343d$var$dragSession) {
            $7394b2797bc2343d$var$dragSession.setup();
            if ((0, $c67ff3d36836a1c1$exports.getDragModality)() === 'keyboard') $7394b2797bc2343d$var$dragSession.next();
        }
    });
    for (let cb of $7394b2797bc2343d$var$subscriptions)cb();
}
function $7394b2797bc2343d$export$418e185dd3f1b968() {
    let [session, setSession] = (0, $k30U5$react.useState)($7394b2797bc2343d$var$dragSession);
    (0, $k30U5$react.useEffect)(()=>{
        let cb = ()=>setSession($7394b2797bc2343d$var$dragSession);
        $7394b2797bc2343d$var$subscriptions.add(cb);
        return ()=>{
            $7394b2797bc2343d$var$subscriptions.delete(cb);
        };
    }, []);
    return session;
}
function $7394b2797bc2343d$export$403bc76cbf68cf60() {
    return !!$7394b2797bc2343d$var$dragSession;
}
function $7394b2797bc2343d$var$endDragging() {
    $7394b2797bc2343d$var$dragSession = null;
    for (let cb of $7394b2797bc2343d$var$subscriptions)cb();
}
function $7394b2797bc2343d$export$7454aff2e161f241(element) {
    for (let target of $7394b2797bc2343d$var$dropTargets.keys()){
        if ((0, $da02ee888921bc9e$exports.nodeContains)(target, element)) return true;
    }
    return false;
}
const $7394b2797bc2343d$var$CANCELED_EVENTS = [
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
const $7394b2797bc2343d$var$CLICK_EVENTS = [
    'pointerup',
    'mouseup',
    'touchend'
];
const $7394b2797bc2343d$var$MESSAGES = {
    keyboard: 'dragStartedKeyboard',
    touch: 'dragStartedTouch',
    virtual: 'dragStartedVirtual'
};
class $7394b2797bc2343d$var$DragSession {
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
        for (let event of $7394b2797bc2343d$var$CANCELED_EVENTS)document.addEventListener(event, this.cancelEvent, true);
        this.mutationObserver = new MutationObserver(()=>this.updateValidDropTargets());
        this.updateValidDropTargets();
        (0, $74b2c5b1e7ea9589$exports.announce)(this.stringFormatter.format($7394b2797bc2343d$var$MESSAGES[(0, $c67ff3d36836a1c1$exports.getDragModality)()]));
    }
    teardown() {
        document.removeEventListener('keydown', this.onKeyDown, true);
        document.removeEventListener('keyup', this.onKeyUp, true);
        window.removeEventListener('focus', this.onFocus, true);
        window.removeEventListener('blur', this.onBlur, true);
        document.removeEventListener('click', this.onClick, true);
        document.removeEventListener('pointerdown', this.onPointerDown, true);
        for (let event of $7394b2797bc2343d$var$CANCELED_EVENTS)document.removeEventListener(event, this.cancelEvent, true);
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
            if (e.altKey || (0, $da02ee888921bc9e$exports.nodeContains)(this.getCurrentActivateButton(), (0, $da02ee888921bc9e$exports.getEventTarget)(e))) this.activate(this.currentDropTarget, this.currentDropItem);
            else this.drop();
        }
    }
    getCurrentActivateButton() {
        return this.currentDropItem?.activateButtonRef?.current ?? this.currentDropTarget?.activateButtonRef?.current ?? null;
    }
    onFocus(e) {
        let activateButton = this.getCurrentActivateButton();
        let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        if (eventTarget === activateButton) {
            // TODO: canceling this breaks the focus ring. Revisit when we support tabbing.
            this.cancelEvent(e);
            return;
        }
        // Prevent focus events, except to the original drag target.
        if (eventTarget !== this.dragTarget.element) this.cancelEvent(e);
        // Ignore focus events on the window/document (JSDOM). Will be handled in onBlur, below.
        if (!(eventTarget instanceof HTMLElement) || eventTarget === this.dragTarget.element) return;
        let dropTarget = this.validDropTargets.find((target)=>target.element === eventTarget) || this.validDropTargets.find((target)=>(0, $da02ee888921bc9e$exports.nodeContains)(target.element, eventTarget));
        if (!dropTarget) {
            // if (e.target === activateButton) {
            //   activateButton.focus();
            // }
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
            return;
        }
        let item = $7394b2797bc2343d$var$dropItems.get(eventTarget);
        if (dropTarget) this.setCurrentDropTarget(dropTarget, item);
    }
    onBlur(e) {
        let activateButton = this.getCurrentActivateButton();
        if (e.relatedTarget === activateButton) {
            this.cancelEvent(e);
            return;
        }
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) !== this.dragTarget.element) this.cancelEvent(e);
        // If nothing is gaining focus, or e.relatedTarget is the window/document (JSDOM),
        // restore focus back to the current drop target if any, or the original drag target.
        if (!e.relatedTarget || !(e.relatedTarget instanceof HTMLElement)) {
            if (this.currentDropTarget) this.currentDropTarget.element.focus();
            else this.dragTarget.element.focus();
        }
    }
    onClick(e) {
        this.cancelEvent(e);
        if ((0, $8f130d4aeb0f65e8$exports.isVirtualClick)(e) || this.isVirtualClick) {
            let dropElements = $7394b2797bc2343d$var$dropItems.values();
            let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
            let item = [
                ...dropElements
            ].find((item)=>item.element === eventTarget || (0, $da02ee888921bc9e$exports.nodeContains)(item.activateButtonRef?.current, eventTarget));
            let dropTarget = this.validDropTargets.find((target)=>(0, $da02ee888921bc9e$exports.nodeContains)(target.element, eventTarget));
            let activateButton = item?.activateButtonRef?.current ?? dropTarget?.activateButtonRef?.current;
            if ((0, $da02ee888921bc9e$exports.nodeContains)(activateButton, eventTarget) && dropTarget) {
                this.activate(dropTarget, item);
                return;
            }
            if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === this.dragTarget.element) {
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
        this.isVirtualClick = (0, $8f130d4aeb0f65e8$exports.isVirtualPointerEvent)(e);
    }
    cancelEvent(e) {
        // Allow focusin and focusout on the drag target so focus ring works properly.
        let eventTarget = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        if ((e.type === 'focusin' || e.type === 'focusout') && (eventTarget === this.dragTarget?.element || eventTarget === this.getCurrentActivateButton())) return;
        // Allow default for events that might cancel a click event
        if (!$7394b2797bc2343d$var$CLICK_EVENTS.includes(e.type)) e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    updateValidDropTargets() {
        if (!this.mutationObserver) return;
        this.mutationObserver.disconnect();
        if (this.restoreAriaHidden) this.restoreAriaHidden();
        this.validDropTargets = $7394b2797bc2343d$var$findValidDropTargets(this.dragTarget);
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
        let types = (0, $c67ff3d36836a1c1$exports.getTypes)(this.dragTarget.items);
        let validDropItems = [
            ...$7394b2797bc2343d$var$dropItems.values()
        ].filter((item)=>{
            if (typeof item.getDropOperation === 'function') return item.getDropOperation(types, this.dragTarget.allowedDropOperations) !== 'cancel';
            return true;
        });
        // Filter out drop targets that contain valid items. We don't want to stop hiding elements
        // other than the drop items that exist inside the collection.
        let visibleDropTargets = this.validDropTargets.filter((target)=>!validDropItems.some((item)=>(0, $da02ee888921bc9e$exports.nodeContains)(target.element, item.element)));
        this.restoreAriaHidden = (0, $3c73045d61be2d91$exports.ariaHideOutside)([
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
                if (label) (0, $74b2c5b1e7ea9589$exports.announce)(label, 'polite');
                this.initialFocused = true;
            }
        }
    }
    end() {
        this.teardown();
        $7394b2797bc2343d$var$endDragging();
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
        (0, $da02ee888921bc9e$exports.getActiveElement)()?.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        this.setCurrentDropTarget(null);
    }
    cancel() {
        this.setCurrentDropTarget(null);
        this.end();
        if (!this.dragTarget.element.closest('[aria-hidden="true"], [inert]')) this.dragTarget.element.focus();
        // Re-trigger focus event on active element, since it will not have received it during dragging (see cancelEvent).
        (0, $da02ee888921bc9e$exports.getActiveElement)()?.dispatchEvent(new FocusEvent('focusin', {
            bubbles: true
        }));
        (0, $74b2c5b1e7ea9589$exports.announce)(this.stringFormatter.format('dropCanceled'));
    }
    drop(item) {
        if (!this.currentDropTarget) {
            this.cancel();
            return;
        }
        if (typeof item?.getDropOperation === 'function') {
            let types = (0, $c67ff3d36836a1c1$exports.getTypes)(this.dragTarget.items);
            this.dropOperation = item.getDropOperation(types, this.dragTarget.allowedDropOperations);
        } else if (typeof this.currentDropTarget.getDropOperation === 'function') {
            let types = (0, $c67ff3d36836a1c1$exports.getTypes)(this.dragTarget.items);
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
        (0, $74b2c5b1e7ea9589$exports.announce)(this.stringFormatter.format('dropComplete'));
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
function $7394b2797bc2343d$var$findValidDropTargets(options) {
    let types = (0, $c67ff3d36836a1c1$exports.getTypes)(options.items);
    return [
        ...$7394b2797bc2343d$var$dropTargets.values()
    ].filter((target)=>{
        if (target.element.closest('[aria-hidden="true"], [inert]')) return false;
        if (typeof target.getDropOperation === 'function') return target.getDropOperation(types, options.allowedDropOperations) !== 'cancel';
        return true;
    });
}


//# sourceMappingURL=DragManager.cjs.map
