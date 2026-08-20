import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useMove as $1dfdc54e7eb53ba0$export$36da96379f79f245} from "../interactions/useMove.mjs";
import {useVisuallyHidden as $ea3928288112382f$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.mjs";
import {useCallback as $8T0lv$useCallback, useRef as $8T0lv$useRef} from "react";

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










function $3c29826b70d739cf$export$9064ff4e44b3729a(props, state, inputRef) {
    let { isDisabled: isDisabled, innerRadius: innerRadius, outerRadius: outerRadius, 'aria-label': ariaLabel, name: name, form: form } = props;
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let thumbRadius = (innerRadius + outerRadius) / 2;
    let focusInput = (0, $8T0lv$useCallback)(()=>{
        if (inputRef.current) (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(inputRef.current);
    }, [
        inputRef
    ]);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(inputRef, state.defaultValue, state.setValue);
    let currentPosition = (0, $8T0lv$useRef)(null);
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        onKeyDown (e) {
            // these are the cases that useMove doesn't handle
            if (!/^(PageUp|PageDown)$/.test(e.key)) {
                e.continuePropagation();
                return;
            }
            // same handling as useMove, don't need to stop propagation, useKeyboard will do that for us
            e.preventDefault();
            // remember to set this and unset it so that onChangeEnd is fired
            state.setDragging(true);
            switch(e.key){
                case 'PageUp':
                    e.preventDefault();
                    state.increment(state.pageStep);
                    break;
                case 'PageDown':
                    e.preventDefault();
                    state.decrement(state.pageStep);
                    break;
            }
            state.setDragging(false);
        }
    });
    let moveHandler = {
        onMoveStart () {
            currentPosition.current = null;
            state.setDragging(true);
        },
        onMove ({ deltaX: deltaX, deltaY: deltaY, pointerType: pointerType, shiftKey: shiftKey }) {
            if (currentPosition.current == null) currentPosition.current = state.getThumbPosition(thumbRadius);
            currentPosition.current.x += deltaX;
            currentPosition.current.y += deltaY;
            if (pointerType === 'keyboard') {
                if (deltaX > 0 || deltaY < 0) state.increment(shiftKey ? state.pageStep : state.step);
                else if (deltaX < 0 || deltaY > 0) state.decrement(shiftKey ? state.pageStep : state.step);
            } else state.setHueFromPoint(currentPosition.current.x, currentPosition.current.y, thumbRadius);
        },
        onMoveEnd () {
            isOnTrack.current = false;
            state.setDragging(false);
            focusInput();
        }
    };
    let { moveProps: movePropsThumb } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)(moveHandler);
    let currentPointer = (0, $8T0lv$useRef)(undefined);
    let isOnTrack = (0, $8T0lv$useRef)(false);
    let { moveProps: movePropsContainer } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)({
        onMoveStart () {
            if (isOnTrack.current) moveHandler.onMoveStart();
        },
        onMove (e) {
            if (isOnTrack.current) moveHandler.onMove(e);
        },
        onMoveEnd () {
            if (isOnTrack.current) moveHandler.onMoveEnd();
        }
    });
    let onThumbDown = (id)=>{
        if (!state.isDragging) {
            currentPointer.current = id;
            focusInput();
            state.setDragging(true);
            if (typeof PointerEvent !== 'undefined') addGlobalListener(window, 'pointerup', onThumbUp, false);
            else {
                addGlobalListener(window, 'mouseup', onThumbUp, false);
                addGlobalListener(window, 'touchend', onThumbUp, false);
            }
        }
    };
    let onThumbUp = (e)=>{
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
        if (id === currentPointer.current) {
            focusInput();
            state.setDragging(false);
            currentPointer.current = undefined;
            isOnTrack.current = false;
            if (typeof PointerEvent !== 'undefined') removeGlobalListener(window, 'pointerup', onThumbUp, false);
            else {
                removeGlobalListener(window, 'mouseup', onThumbUp, false);
                removeGlobalListener(window, 'touchend', onThumbUp, false);
            }
        }
    };
    let onTrackDown = (track, id, pageX, pageY)=>{
        let rect = track.getBoundingClientRect();
        let x = pageX - rect.x - rect.width / 2;
        let y = pageY - rect.y - rect.height / 2;
        let radius = Math.sqrt(x * x + y * y);
        if (innerRadius < radius && radius < outerRadius && !state.isDragging && currentPointer.current === undefined) {
            isOnTrack.current = true;
            currentPointer.current = id;
            state.setHueFromPoint(x, y, radius);
            focusInput();
            state.setDragging(true);
            if (typeof PointerEvent !== 'undefined') addGlobalListener(window, 'pointerup', onTrackUp, false);
            else {
                addGlobalListener(window, 'mouseup', onTrackUp, false);
                addGlobalListener(window, 'touchend', onTrackUp, false);
            }
        }
    };
    let onTrackUp = (e)=>{
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
        if (isOnTrack.current && id === currentPointer.current) {
            isOnTrack.current = false;
            currentPointer.current = undefined;
            state.setDragging(false);
            focusInput();
            if (typeof PointerEvent !== 'undefined') removeGlobalListener(window, 'pointerup', onTrackUp, false);
            else {
                removeGlobalListener(window, 'mouseup', onTrackUp, false);
                removeGlobalListener(window, 'touchend', onTrackUp, false);
            }
        }
    };
    let trackInteractions = isDisabled ? {} : (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)({
        ...typeof PointerEvent !== 'undefined' ? {
            onPointerDown: (e)=>{
                if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onTrackDown(e.currentTarget, e.pointerId, e.clientX, e.clientY);
            }
        } : {
            onMouseDown: (e)=>{
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onTrackDown(e.currentTarget, undefined, e.clientX, e.clientY);
            },
            onTouchStart: (e)=>{
                onTrackDown(e.currentTarget, e.changedTouches[0].identifier, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        }
    }, movePropsContainer);
    let thumbInteractions = isDisabled ? {} : (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)({
        ...typeof PointerEvent !== 'undefined' ? {
            onPointerDown: (e)=>{
                if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onThumbDown(e.pointerId);
            }
        } : {
            onMouseDown: (e)=>{
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onThumbDown(undefined);
            },
            onTouchStart: (e)=>{
                onThumbDown(e.changedTouches[0].identifier);
            }
        }
    }, keyboardProps, movePropsThumb);
    let { x: x, y: y } = state.getThumbPosition(thumbRadius);
    // Provide a default aria-label if none is given
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    if (ariaLabel == null && props['aria-labelledby'] == null) ariaLabel = state.value.getChannelName('hue', locale);
    let inputLabellingProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel
    });
    let { minValue: minValue, maxValue: maxValue, step: step } = state.value.getChannelRange('hue');
    let forcedColorAdjustNoneStyle = {
        forcedColorAdjust: 'none'
    };
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $ea3928288112382f$export$a966af930f325cab)({
        style: {
            opacity: '0.0001',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        }
    });
    return {
        trackProps: {
            ...trackInteractions,
            style: {
                position: 'relative',
                touchAction: 'none',
                width: outerRadius * 2,
                height: outerRadius * 2,
                background: `
          conic-gradient(
            from 90deg,
            hsl(0, 100%, 50%),
            hsl(30, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(90, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(150, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(210, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(270, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(330, 100%, 50%),
            hsl(360, 100%, 50%)
          )
        `,
                clipPath: `path(evenodd, "${$3c29826b70d739cf$var$circlePath(outerRadius, outerRadius, outerRadius)} ${$3c29826b70d739cf$var$circlePath(outerRadius, outerRadius, innerRadius)}")`,
                ...forcedColorAdjustNoneStyle
            }
        },
        thumbProps: {
            ...thumbInteractions,
            style: {
                position: 'absolute',
                left: (outerRadius + x).toFixed(3) + 'px',
                top: (outerRadius + y).toFixed(3) + 'px',
                transform: 'translate(-50%, -50%)',
                touchAction: 'none',
                ...forcedColorAdjustNoneStyle
            }
        },
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(inputLabellingProps, {
            type: 'range',
            min: String(minValue),
            max: String(maxValue),
            step: String(step),
            'aria-valuetext': `${state.value.formatChannelValue('hue', locale)}, ${state.value.getHueName(locale)}`,
            disabled: isDisabled,
            value: `${state.value.getChannelValue('hue')}`,
            name: name,
            form: form,
            onChange: (e)=>{
                state.setHue(parseFloat((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e).value));
            },
            style: visuallyHiddenProps.style,
            'aria-errormessage': props['aria-errormessage'],
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details']
        })
    };
}
// Creates an SVG path string for a circle.
function $3c29826b70d739cf$var$circlePath(cx, cy, r) {
    return `M ${cx}, ${cy} m ${-r}, 0 a ${r}, ${r}, 0, 1, 0, ${r * 2}, 0 a ${r}, ${r}, 0, 1, 0 ${-r * 2}, 0`;
}


export {$3c29826b70d739cf$export$9064ff4e44b3729a as useColorWheel};
//# sourceMappingURL=useColorWheel.mjs.map
