var $360420b928cc5d13$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $04affd2086a7db64$exports = require("../utils/useGlobalListeners.cjs");
var $ec895d26f03379ea$exports = require("../label/useLabel.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $2304f84c457be372$exports = require("../interactions/useMove.cjs");
var $cK0as$reactstatelyprivateutilsnumber = require("react-stately/private/utils/number");
var $cK0as$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSlider", function () { return $0c3fa8b49a5ed605$export$56b2c08e277f365; });
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








function $0c3fa8b49a5ed605$export$56b2c08e277f365(props, state, trackRef) {
    let { labelProps: labelProps, fieldProps: fieldProps } = (0, $ec895d26f03379ea$exports.useLabel)(props);
    let isVertical = props.orientation === 'vertical';
    // Attach id of the label to the state so it can be accessed by useSliderThumb.
    (0, $360420b928cc5d13$exports.sliderData).set(state, {
        id: labelProps.id ?? fieldProps.id,
        'aria-describedby': props['aria-describedby'],
        'aria-details': props['aria-details']
    });
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $04affd2086a7db64$exports.useGlobalListeners)();
    // When the user clicks or drags the track, we want the motion to set and drag the
    // closest thumb.  Hence we also need to install useMove() on the track element.
    // Here, we keep track of which index is the "closest" to the drag start point.
    // It is set onMouseDown/onTouchDown; see trackProps below.
    const realTimeTrackDraggingIndex = (0, $cK0as$react.useRef)(null);
    const reverseX = direction === 'rtl';
    const currentPosition = (0, $cK0as$react.useRef)(null);
    const { moveProps: moveProps } = (0, $2304f84c457be372$exports.useMove)({
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
                const percent = (0, $cK0as$reactstatelyprivateutilsnumber.clamp)(currentPosition.current / size, 0, 1);
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
    let currentPointer = (0, $cK0as$react.useRef)(undefined);
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
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
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
            // Safari does not focus <input type="range"> elements when clicking on an associated <label>,
            // so do it manually. In addition, make sure we show the focus ring.
            document.getElementById((0, $360420b928cc5d13$exports.getSliderThumbId)(state, 0))?.focus();
            (0, $d0df89f3abe2c2ca$exports.setInteractionModality)('keyboard');
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
        trackProps: (0, $89b39774f3b79dbb$exports.mergeProps)({
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
            htmlFor: state.values.map((_, index)=>(0, $360420b928cc5d13$exports.getSliderThumbId)(state, index)).join(' '),
            'aria-live': 'off'
        }
    };
}


//# sourceMappingURL=useSlider.cjs.map
