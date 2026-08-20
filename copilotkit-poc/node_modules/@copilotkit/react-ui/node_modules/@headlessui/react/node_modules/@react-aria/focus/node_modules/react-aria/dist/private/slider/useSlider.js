import {getSliderThumbId as $1b9c3fe237249a6a$export$68e648cbec363a18, sliderData as $1b9c3fe237249a6a$export$d6c8d9636a3dc49c} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {setInteractionModality as $b50b1cc8a843ace7$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useLabel as $6dc0ccf02415c0af$export$8467354a121f1b9f} from "../label/useLabel.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useMove as $e7c7f5ffbc8157af$export$36da96379f79f245} from "../interactions/useMove.js";
import {clamp as $k4H1b$clamp} from "react-stately/private/utils/number";
import {useRef as $k4H1b$useRef} from "react";

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








function $da0bbb7d9303a211$export$56b2c08e277f365(props, state, trackRef) {
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $6dc0ccf02415c0af$export$8467354a121f1b9f)(props);
    let isVertical = props.orientation === 'vertical';
    var _labelProps_id;
    // Attach id of the label to the state so it can be accessed by useSliderThumb.
    (0, $1b9c3fe237249a6a$export$d6c8d9636a3dc49c).set(state, {
        id: (_labelProps_id = labelProps.id) !== null && _labelProps_id !== void 0 ? _labelProps_id : fieldProps.id,
        'aria-describedby': props['aria-describedby'],
        'aria-details': props['aria-details']
    });
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    // When the user clicks or drags the track, we want the motion to set and drag the
    // closest thumb.  Hence we also need to install useMove() on the track element.
    // Here, we keep track of which index is the "closest" to the drag start point.
    // It is set onMouseDown/onTouchDown; see trackProps below.
    const realTimeTrackDraggingIndex = (0, $k4H1b$useRef)(null);
    const reverseX = direction === 'rtl';
    const currentPosition = (0, $k4H1b$useRef)(null);
    const { moveProps: moveProps } = (0, $e7c7f5ffbc8157af$export$36da96379f79f245)({
        onMoveStart () {
            currentPosition.current = null;
        },
        onMove ({ deltaX: deltaX, deltaY: deltaY }) {
            if (!trackRef.current) return;
            let { height: height, width: width } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            if (currentPosition.current == null && realTimeTrackDraggingIndex.current != null) currentPosition.current = state.getThumbPercent(realTimeTrackDraggingIndex.current) * size;
            let delta = isVertical ? deltaY : deltaX;
            if (isVertical || reverseX) delta = -delta;
            currentPosition.current += delta;
            if (realTimeTrackDraggingIndex.current != null && trackRef.current) {
                const percent = (0, $k4H1b$clamp)(currentPosition.current / size, 0, 1);
                state.setThumbPercent(realTimeTrackDraggingIndex.current, percent);
            }
        },
        onMoveEnd () {
            if (realTimeTrackDraggingIndex.current != null) {
                state.setThumbDragging(realTimeTrackDraggingIndex.current, false);
                realTimeTrackDraggingIndex.current = null;
            }
        }
    });
    let currentPointer = (0, $k4H1b$useRef)(undefined);
    let onDownTrack = (e, id, clientX, clientY)=>{
        // We only trigger track-dragging if the user clicks on the track itself and nothing is currently being dragged.
        if (trackRef.current && !props.isDisabled && state.values.every((_, i)=>!state.isThumbDragging(i))) {
            let { height: height, width: width, top: top, left: left } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            // Find the closest thumb
            const trackPosition = isVertical ? top : left;
            const clickPosition = isVertical ? clientY : clientX;
            const offset = clickPosition - trackPosition;
            let percent = offset / size;
            if (direction === 'rtl' || isVertical) percent = 1 - percent;
            let value = state.getPercentValue(percent);
            // to find the closet thumb we split the array based on the first thumb position to the "right/end" of the click.
            let closestThumb;
            let split = state.values.findIndex((v)=>value - v < 0);
            if (split === 0) // If the index is zero then the closetThumb is the first one
            closestThumb = split;
            else if (split === -1) // If no index is found they've clicked past all the thumbs
            closestThumb = state.values.length - 1;
            else {
                let lastLeft = state.values[split - 1];
                let firstRight = state.values[split];
                // Pick the last left/start thumb, unless they are stacked on top of each other, then pick the right/end one
                if (Math.abs(lastLeft - value) < Math.abs(firstRight - value)) closestThumb = split - 1;
                else closestThumb = split;
            }
            // Confirm that the found closest thumb is editable, not disabled, and move it
            if (closestThumb >= 0 && state.isThumbEditable(closestThumb)) {
                // Don't unfocus anything
                e.preventDefault();
                realTimeTrackDraggingIndex.current = closestThumb;
                state.setFocusedThumb(closestThumb);
                currentPointer.current = id;
                state.setThumbDragging(realTimeTrackDraggingIndex.current, true);
                state.setThumbValue(closestThumb, value);
                addGlobalListener(window, 'mouseup', onUpTrack, false);
                addGlobalListener(window, 'touchend', onUpTrack, false);
                addGlobalListener(window, 'pointerup', onUpTrack, false);
            } else realTimeTrackDraggingIndex.current = null;
        }
    };
    let onUpTrack = (e)=>{
        var _e_changedTouches;
        var _e_pointerId;
        let id = (_e_pointerId = e.pointerId) !== null && _e_pointerId !== void 0 ? _e_pointerId : (_e_changedTouches = e.changedTouches) === null || _e_changedTouches === void 0 ? void 0 : _e_changedTouches[0].identifier;
        if (id === currentPointer.current) {
            if (realTimeTrackDraggingIndex.current != null) {
                state.setThumbDragging(realTimeTrackDraggingIndex.current, false);
                realTimeTrackDraggingIndex.current = null;
            }
            removeGlobalListener(window, 'mouseup', onUpTrack, false);
            removeGlobalListener(window, 'touchend', onUpTrack, false);
            removeGlobalListener(window, 'pointerup', onUpTrack, false);
        }
    };
    if ('htmlFor' in labelProps && labelProps.htmlFor) {
        // Ideally the `for` attribute should point to the first thumb, but VoiceOver on iOS
        // causes this to override the `aria-labelledby` on the thumb. This causes the first
        // thumb to only be announced as the slider label rather than its individual name as well.
        // See https://bugs.webkit.org/show_bug.cgi?id=172464.
        delete labelProps.htmlFor;
        labelProps.onClick = ()=>{
            var // Safari does not focus <input type="range"> elements when clicking on an associated <label>,
            // so do it manually. In addition, make sure we show the focus ring.
            _document_getElementById;
            (_document_getElementById = document.getElementById((0, $1b9c3fe237249a6a$export$68e648cbec363a18)(state, 0))) === null || _document_getElementById === void 0 ? void 0 : _document_getElementById.focus();
            (0, $b50b1cc8a843ace7$export$8397ddfc504fdb9a)('keyboard');
        };
    }
    return {
        labelProps: labelProps,
        // The root element of the Slider will have role="group" to group together
        // all the thumb inputs in the Slider.  The label of the Slider will
        // be used to label the group.
        groupProps: {
            role: 'group',
            ...fieldProps
        },
        trackProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)({
            onMouseDown (e) {
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onDownTrack(e, undefined, e.clientX, e.clientY);
            },
            onPointerDown (e) {
                if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onDownTrack(e, e.pointerId, e.clientX, e.clientY);
            },
            onTouchStart (e) {
                onDownTrack(e, e.changedTouches[0].identifier, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            },
            style: {
                position: 'relative',
                touchAction: 'none'
            }
        }, moveProps),
        outputProps: {
            htmlFor: state.values.map((_, index)=>(0, $1b9c3fe237249a6a$export$68e648cbec363a18)(state, index)).join(' '),
            'aria-live': 'off'
        }
    };
}


export {$da0bbb7d9303a211$export$56b2c08e277f365 as useSlider};
//# sourceMappingURL=useSlider.js.map
