var $7394b2797bc2343d$exports = require("./DragManager.cjs");
var $47f95f5edd0c867d$exports = require("./constants.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $c67ff3d36836a1c1$exports = require("./utils.cjs");
var $89d6f7d3313f2c1d$exports = require("./intlStrings.cjs");
var $8f130d4aeb0f65e8$exports = require("../utils/isVirtualEvent.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $04affd2086a7db64$exports = require("../utils/useGlobalListeners.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $69QEi$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDrag", function () { return $bc8c67c7657c5f5a$export$7941f8aafa4b6021; });
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









const $bc8c67c7657c5f5a$var$MESSAGES = {
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
function $bc8c67c7657c5f5a$export$7941f8aafa4b6021(options) {
    let { hasDragButton: hasDragButton, isDisabled: isDisabled } = options;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($89d6f7d3313f2c1d$exports))), '@react-aria/dnd');
    let state = (0, $69QEi$react.useRef)({
        options: options,
        x: 0,
        y: 0
    }).current;
    state.options = options;
    let isDraggingRef = (0, $69QEi$react.useRef)(null);
    let [isDragging, setDraggingState] = (0, $69QEi$react.useState)(false);
    let setDragging = (element)=>{
        isDraggingRef.current = element;
        setDraggingState(!!element);
    };
    let { addGlobalListener: addGlobalListener, removeAllGlobalListeners: removeAllGlobalListeners } = (0, $04affd2086a7db64$exports.useGlobalListeners)();
    let modalityOnPointerDown = (0, $69QEi$react.useRef)(null);
    let onDragStart = (e)=>{
        if (e.defaultPrevented) return;
        // Prevent the drag event from propagating to any parent draggables
        e.stopPropagation();
        // If this drag was initiated by a mobile screen reader (e.g. VoiceOver or TalkBack), enter virtual dragging mode.
        if (modalityOnPointerDown.current === 'virtual') {
            e.preventDefault();
            startDragging((0, $da02ee888921bc9e$exports.getEventTarget)(e));
            modalityOnPointerDown.current = null;
            return;
        }
        if (typeof options.onDragStart === 'function') options.onDragStart({
            type: 'dragstart',
            x: e.clientX,
            y: e.clientY
        });
        let items = options.getItems();
        // Clear existing data (e.g. selected text on the page would be included in some browsers)
        e.dataTransfer.clearData?.();
        (0, $c67ff3d36836a1c1$exports.writeToDataTransfer)(e.dataTransfer, items);
        let allowed = (0, $47f95f5edd0c867d$exports.DROP_OPERATION).all;
        if (typeof options.getAllowedDropOperations === 'function') {
            let allowedOperations = options.getAllowedDropOperations();
            allowed = (0, $47f95f5edd0c867d$exports.DROP_OPERATION).none;
            for (let operation of allowedOperations)allowed |= (0, $47f95f5edd0c867d$exports.DROP_OPERATION)[operation] || (0, $47f95f5edd0c867d$exports.DROP_OPERATION).none;
        }
        (0, $c67ff3d36836a1c1$exports.setGlobalAllowedDropOperations)(allowed);
        let effectAllowed = (0, $47f95f5edd0c867d$exports.EFFECT_ALLOWED)[allowed] || 'none';
        e.dataTransfer.effectAllowed = effectAllowed === 'cancel' ? 'none' : effectAllowed;
        // If there is a preview option, use it to render a custom preview image that will
        // appear under the pointer while dragging. If not, the element itself is dragged by the browser.
        if (typeof options.preview?.current === 'function') options.preview.current(items, (node, userX, userY)=>{
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
        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
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
                dropOperation: (0, $47f95f5edd0c867d$exports.DROP_EFFECT_TO_DROP_OPERATION)[e.dataTransfer.dropEffect]
            };
            // Chrome Android always returns none as its dropEffect so we use the drop effect set in useDrop via
            // onDragEnter/onDragOver instead. https://bugs.chromium.org/p/chromium/issues/detail?id=1353951
            if (0, $c67ff3d36836a1c1$exports.globalDropEffect) event.dropOperation = (0, $47f95f5edd0c867d$exports.DROP_EFFECT_TO_DROP_OPERATION)[0, $c67ff3d36836a1c1$exports.globalDropEffect];
            options.onDragEnd(event);
        }
        setDragging(null);
        removeAllGlobalListeners();
        (0, $c67ff3d36836a1c1$exports.setGlobalAllowedDropOperations)((0, $47f95f5edd0c867d$exports.DROP_OPERATION).none);
        (0, $c67ff3d36836a1c1$exports.setGlobalDropEffect)(undefined);
    };
    // If the dragged element is removed from the DOM via onDrop, onDragEnd won't fire: https://bugzilla.mozilla.org/show_bug.cgi?id=460801
    // In this case, we need to manually call onDragEnd on cleanup
    (0, $69QEi$react.useEffect)(()=>{
        return ()=>{
            // Check that the dragged element has actually unmounted from the DOM and not a React Strict Mode false positive.
            // https://github.com/facebook/react/issues/29585
            // React 16 ran effect cleanups before removing elements from the DOM but did not have this issue.
            if (isDraggingRef.current && (!isDraggingRef.current.isConnected || parseInt((0, $69QEi$react.version), 10) < 17)) {
                if (typeof state.options.onDragEnd === 'function') {
                    let event = {
                        type: 'dragend',
                        x: 0,
                        y: 0,
                        dropOperation: (0, $47f95f5edd0c867d$exports.DROP_EFFECT_TO_DROP_OPERATION)[(0, $c67ff3d36836a1c1$exports.globalDropEffect) || 'none']
                    };
                    state.options.onDragEnd(event);
                }
                setDragging(null);
                (0, $c67ff3d36836a1c1$exports.setGlobalAllowedDropOperations)((0, $47f95f5edd0c867d$exports.DROP_OPERATION).none);
                (0, $c67ff3d36836a1c1$exports.setGlobalDropEffect)(undefined);
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
        $7394b2797bc2343d$exports.beginDragging({
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
    let modality = (0, $c67ff3d36836a1c1$exports.useDragModality)();
    let message = !isDragging ? $bc8c67c7657c5f5a$var$MESSAGES[modality].start : $bc8c67c7657c5f5a$var$MESSAGES[modality].end;
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(stringFormatter.format(message));
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
            modalityOnPointerDown.current = (0, $8f130d4aeb0f65e8$exports.isVirtualPointerEvent)(e.nativeEvent) ? 'virtual' : e.pointerType;
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
            if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === e.currentTarget && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
            }
        },
        onKeyUpCapture (e) {
            if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === e.currentTarget && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                startDragging((0, $da02ee888921bc9e$exports.getEventTarget)(e));
            }
        },
        onClick (e) {
            // Handle NVDA/JAWS in browse mode, and touch screen readers. In this case, no keyboard events are fired.
            if ((0, $8f130d4aeb0f65e8$exports.isVirtualClick)(e.nativeEvent) || modalityOnPointerDown.current === 'virtual') {
                e.preventDefault();
                e.stopPropagation();
                startDragging((0, $da02ee888921bc9e$exports.getEventTarget)(e));
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


//# sourceMappingURL=useDrag.cjs.map
