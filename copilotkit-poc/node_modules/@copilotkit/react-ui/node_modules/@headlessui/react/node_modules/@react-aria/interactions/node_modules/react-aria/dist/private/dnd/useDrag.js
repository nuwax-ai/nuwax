import {beginDragging as $e1cd17e16f360ff6$export$549dbcf8649bf3b2} from "./DragManager.js";
import {DROP_EFFECT_TO_DROP_OPERATION as $a5876944c9299b39$export$608ecc6f1b23c35d, DROP_OPERATION as $a5876944c9299b39$export$60b7b4bcf3903d8e, EFFECT_ALLOWED as $a5876944c9299b39$export$dd0165308d8bff45} from "./constants.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {globalDropEffect as $a279fa400589a731$export$8e6636520ac15722, setGlobalAllowedDropOperations as $a279fa400589a731$export$6539bc8c3a0a2d67, setGlobalDropEffect as $a279fa400589a731$export$64f52ed7349ddb84, useDragModality as $a279fa400589a731$export$49bac5d6d4b352ea, writeToDataTransfer as $a279fa400589a731$export$f9c1490890ddd063} from "./utils.js";
import $8164b$intlStringsjs from "./intlStrings.js";
import {isVirtualClick as $fa0ef9dfcca012a7$export$60278871457622de, isVirtualPointerEvent as $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63} from "../utils/isVirtualEvent.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useRef as $8164b$useRef, useState as $8164b$useState, useEffect as $8164b$useEffect, version as $8164b$version} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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









const $220be66a19152688$var$MESSAGES = {
    keyboard: {
        start: 'dragDescriptionKeyboard',
        end: 'endDragKeyboard'
    },
    touch: {
        start: 'dragDescriptionTouch',
        end: 'endDragTouch'
    },
    virtual: {
        start: 'dragDescriptionVirtual',
        end: 'endDragVirtual'
    }
};
function $220be66a19152688$export$7941f8aafa4b6021(options) {
    let { hasDragButton: hasDragButton, isDisabled: isDisabled } = options;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($8164b$intlStringsjs))), '@react-aria/dnd');
    let state = (0, $8164b$useRef)({
        options: options,
        x: 0,
        y: 0
    }).current;
    state.options = options;
    let isDraggingRef = (0, $8164b$useRef)(null);
    let [isDragging, setDraggingState] = (0, $8164b$useState)(false);
    let setDragging = (element)=>{
        isDraggingRef.current = element;
        setDraggingState(!!element);
    };
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let modalityOnPointerDown = (0, $8164b$useRef)(null);
    let onDragStart = (e)=>{
        var // Clear existing data (e.g. selected text on the page would be included in some browsers)
        _e_dataTransfer_clearData, _e_dataTransfer, _options_preview;
        if (e.defaultPrevented) return;
        // Prevent the drag event from propagating to any parent draggables
        e.stopPropagation();
        // If this drag was initiated by a mobile screen reader (e.g. VoiceOver or TalkBack), enter virtual dragging mode.
        if (modalityOnPointerDown.current === 'virtual') {
            e.preventDefault();
            startDragging((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
            modalityOnPointerDown.current = null;
            return;
        }
        if (typeof options.onDragStart === 'function') options.onDragStart({
            type: 'dragstart',
            x: e.clientX,
            y: e.clientY
        });
        let items = options.getItems();
        (_e_dataTransfer_clearData = (_e_dataTransfer = e.dataTransfer).clearData) === null || _e_dataTransfer_clearData === void 0 ? void 0 : _e_dataTransfer_clearData.call(_e_dataTransfer);
        (0, $a279fa400589a731$export$f9c1490890ddd063)(e.dataTransfer, items);
        let allowed = (0, $a5876944c9299b39$export$60b7b4bcf3903d8e).all;
        if (typeof options.getAllowedDropOperations === 'function') {
            let allowedOperations = options.getAllowedDropOperations();
            allowed = (0, $a5876944c9299b39$export$60b7b4bcf3903d8e).none;
            for (let operation of allowedOperations)allowed |= (0, $a5876944c9299b39$export$60b7b4bcf3903d8e)[operation] || (0, $a5876944c9299b39$export$60b7b4bcf3903d8e).none;
        }
        (0, $a279fa400589a731$export$6539bc8c3a0a2d67)(allowed);
        let effectAllowed = (0, $a5876944c9299b39$export$dd0165308d8bff45)[allowed] || 'none';
        e.dataTransfer.effectAllowed = effectAllowed === 'cancel' ? 'none' : effectAllowed;
        // If there is a preview option, use it to render a custom preview image that will
        // appear under the pointer while dragging. If not, the element itself is dragged by the browser.
        if (typeof ((_options_preview = options.preview) === null || _options_preview === void 0 ? void 0 : _options_preview.current) === 'function') options.preview.current(items, (node, userX, userY)=>{
            if (!node) return;
            // Compute the offset that the preview will appear under the mouse.
            // If possible, this is based on the point the user clicked on the target.
            // If the preview is much smaller, then just use the center point of the preview.
            let size = node.getBoundingClientRect();
            let rect = e.currentTarget.getBoundingClientRect();
            let defaultX = e.clientX - rect.x;
            let defaultY = e.clientY - rect.y;
            if (defaultX > size.width || defaultY > size.height) {
                defaultX = size.width / 2;
                defaultY = size.height / 2;
            }
            // Start with default offsets.
            let offsetX = defaultX;
            let offsetY = defaultY;
            // If the preview renderer supplied explicit offsets, use those.
            if (typeof userX === 'number' && typeof userY === 'number') {
                offsetX = userX;
                offsetY = userY;
            }
            // Clamp the offset so it stays within the preview bounds. Browsers
            // automatically clamp out-of-range values, but doing it ourselves
            // prevents the visible "snap" that can occur when the browser adjusts
            // them after the first drag update.
            offsetX = Math.max(0, Math.min(offsetX, size.width));
            offsetY = Math.max(0, Math.min(offsetY, size.height));
            // Rounding height to an even number prevents blurry preview seen on some screens
            let height = 2 * Math.round(size.height / 2);
            node.style.height = `${height}px`;
            e.dataTransfer.setDragImage(node, offsetX, offsetY);
        });
        // Enforce that drops are handled by useDrop.
        addGlobalListener(window, 'drop', (e)=>{
            e.preventDefault();
            e.stopPropagation();
            console.warn('Drags initiated from the React Aria useDrag hook may only be dropped on a target created with useDrop. This ensures that a keyboard and screen reader accessible alternative is available.');
        }, {
            once: true
        });
        state.x = e.clientX;
        state.y = e.clientY;
        // Wait a frame before we set dragging to true so that the browser has time to
        // render the preview image before we update the element that has been dragged.
        let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        requestAnimationFrame(()=>{
            setDragging(target);
        });
    };
    let onDrag = (e)=>{
        // Prevent the drag event from propagating to any parent draggables
        e.stopPropagation();
        if (e.clientX === state.x && e.clientY === state.y) return;
        if (typeof options.onDragMove === 'function') options.onDragMove({
            type: 'dragmove',
            x: e.clientX,
            y: e.clientY
        });
        state.x = e.clientX;
        state.y = e.clientY;
    };
    let onDragEnd = (e)=>{
        // Prevent the drag event from propagating to any parent draggables
        e.stopPropagation();
        if (typeof options.onDragEnd === 'function') {
            let event = {
                type: 'dragend',
                x: e.clientX,
                y: e.clientY,
                dropOperation: (0, $a5876944c9299b39$export$608ecc6f1b23c35d)[e.dataTransfer.dropEffect]
            };
            // Chrome Android always returns none as its dropEffect so we use the drop effect set in useDrop via
            // onDragEnter/onDragOver instead. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
            if (0, $a279fa400589a731$export$8e6636520ac15722) event.dropOperation = (0, $a5876944c9299b39$export$608ecc6f1b23c35d)[0, $a279fa400589a731$export$8e6636520ac15722];
            options.onDragEnd(event);
        }
        setDragging(null);
        removeAllGlobalListeners();
        (0, $a279fa400589a731$export$6539bc8c3a0a2d67)((0, $a5876944c9299b39$export$60b7b4bcf3903d8e).none);
        (0, $a279fa400589a731$export$64f52ed7349ddb84)(undefined);
    };
    // If the dragged element is removed from the DOM via onDrop, onDragEnd won't fire: https://bugzilla.mozilla.org/show_bug.cgi?id=460801
    // In this case, we need to manually call onDragEnd on cleanup
    (0, $8164b$useEffect)(()=>{
        return ()=>{
            // Check that the dragged element has actually unmounted from the DOM and not a React Strict Mode false positive.
            // https://github.com/facebook/react/issues/29585
            // React 16 ran effect cleanups before removing elements from the DOM but did not have this issue.
            if (isDraggingRef.current && (!isDraggingRef.current.isConnected || parseInt((0, $8164b$version), 10) < 17)) {
                if (typeof state.options.onDragEnd === 'function') {
                    let event = {
                        type: 'dragend',
                        x: 0,
                        y: 0,
                        dropOperation: (0, $a5876944c9299b39$export$608ecc6f1b23c35d)[(0, $a279fa400589a731$export$8e6636520ac15722) || 'none']
                    };
                    state.options.onDragEnd(event);
                }
                setDragging(null);
                (0, $a279fa400589a731$export$6539bc8c3a0a2d67)((0, $a5876944c9299b39$export$60b7b4bcf3903d8e).none);
                (0, $a279fa400589a731$export$64f52ed7349ddb84)(undefined);
            }
        };
    }, [
        state
    ]);
    let onPress = (e)=>{
        if (e.pointerType !== 'keyboard' && e.pointerType !== 'virtual') return;
        startDragging(e.target);
    };
    let startDragging = (target)=>{
        if (typeof state.options.onDragStart === 'function') {
            let rect = target.getBoundingClientRect();
            state.options.onDragStart({
                type: 'dragstart',
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2
            });
        }
        $e1cd17e16f360ff6$export$549dbcf8649bf3b2({
            element: target,
            items: state.options.getItems(),
            allowedDropOperations: typeof state.options.getAllowedDropOperations === 'function' ? state.options.getAllowedDropOperations() : [
                'move',
                'copy',
                'link'
            ],
            onDragEnd (e) {
                setDragging(null);
                if (typeof state.options.onDragEnd === 'function') state.options.onDragEnd(e);
            }
        }, stringFormatter);
        setDragging(target);
    };
    let modality = (0, $a279fa400589a731$export$49bac5d6d4b352ea)();
    let message = !isDragging ? $220be66a19152688$var$MESSAGES[modality].start : $220be66a19152688$var$MESSAGES[modality].end;
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(stringFormatter.format(message));
    let interactions = {};
    if (!hasDragButton) // If there's no separate button to trigger accessible drag and drop mode,
    // then add event handlers to the draggable element itself to start dragging.
    // For keyboard, we use the Enter key in a capturing listener to prevent other
    // events such as selection from also occurring. We attempt to infer whether a
    // pointer event (e.g. long press) came from a touch screen reader, and then initiate
    // dragging in the native onDragStart listener above.
    interactions = {
        ...descriptionProps,
        onPointerDown (e) {
            modalityOnPointerDown.current = (0, $fa0ef9dfcca012a7$export$29bf1b5f2c56cf63)(e.nativeEvent) ? 'virtual' : e.pointerType;
            // Try to detect virtual drag passthrough gestures.
            if (e.width < 1 && e.height < 1) // iOS VoiceOver.
            modalityOnPointerDown.current = 'virtual';
            else {
                let rect = e.currentTarget.getBoundingClientRect();
                let offsetX = e.clientX - rect.x;
                let offsetY = e.clientY - rect.y;
                let centerX = rect.width / 2;
                let centerY = rect.height / 2;
                if (Math.abs(offsetX - centerX) <= 0.5 && Math.abs(offsetY - centerY) <= 0.5) // Android TalkBack.
                modalityOnPointerDown.current = 'virtual';
                else modalityOnPointerDown.current = e.pointerType;
            }
        },
        onKeyDownCapture (e) {
            if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === e.currentTarget && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        onKeyUpCapture (e) {
            if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === e.currentTarget && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                startDragging((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
            }
        },
        onClick (e) {
            // Handle NVDA/JAWS in browse mode, and touch screen readers. In this case, no keyboard events are fired.
            if ((0, $fa0ef9dfcca012a7$export$60278871457622de)(e.nativeEvent) || modalityOnPointerDown.current === 'virtual') {
                e.preventDefault();
                e.stopPropagation();
                startDragging((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
            }
        }
    };
    if (isDisabled) return {
        dragProps: {
            draggable: 'false'
        },
        dragButtonProps: {},
        isDragging: false
    };
    return {
        dragProps: {
            ...interactions,
            draggable: 'true',
            onDragStart: onDragStart,
            onDrag: onDrag,
            onDragEnd: onDragEnd
        },
        dragButtonProps: {
            ...descriptionProps,
            onPress: onPress
        },
        isDragging: isDragging
    };
}


export {$220be66a19152688$export$7941f8aafa4b6021 as useDrag};
//# sourceMappingURL=useDrag.js.map
