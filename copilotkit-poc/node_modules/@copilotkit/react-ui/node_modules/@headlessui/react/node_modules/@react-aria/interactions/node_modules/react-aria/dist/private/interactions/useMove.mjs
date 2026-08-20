import {disableTextSelection as $cbf007e418543821$export$16a4697467175487, restoreTextSelection as $cbf007e418543821$export$b0d6fa1ab32e3295} from "./textSelection.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getOwnerWindow as $d447af545b77c9f1$export$f21a1ffae260145a} from "../utils/domHelpers.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useRef as $29Bzt$useRef, useCallback as $29Bzt$useCallback, useMemo as $29Bzt$useMemo} from "react";

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





function $1dfdc54e7eb53ba0$export$36da96379f79f245(props) {
    let { onMoveStart: onMoveStart, onMove: onMove, onMoveEnd: onMoveEnd } = props;
    let state = (0, $29Bzt$useRef)({
        didMove: false,
        lastPosition: null,
        id: null
    });
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let move = (0, $29Bzt$useCallback)((originalEvent, pointerType, deltaX, deltaY)=>{
        if (deltaX === 0 && deltaY === 0) return;
        if (!state.current.didMove) {
            state.current.didMove = true;
            onMoveStart?.({
                type: 'movestart',
                pointerType: pointerType,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        }
        onMove?.({
            type: 'move',
            pointerType: pointerType,
            deltaX: deltaX,
            deltaY: deltaY,
            shiftKey: originalEvent.shiftKey,
            metaKey: originalEvent.metaKey,
            ctrlKey: originalEvent.ctrlKey,
            altKey: originalEvent.altKey
        });
    }, [
        onMoveStart,
        onMove,
        state
    ]);
    let moveEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(move);
    let end = (0, $29Bzt$useCallback)((originalEvent, pointerType)=>{
        (0, $cbf007e418543821$export$b0d6fa1ab32e3295)();
        if (state.current.didMove) onMoveEnd?.({
            type: 'moveend',
            pointerType: pointerType,
            shiftKey: originalEvent.shiftKey,
            metaKey: originalEvent.metaKey,
            ctrlKey: originalEvent.ctrlKey,
            altKey: originalEvent.altKey
        });
    }, [
        onMoveEnd,
        state
    ]);
    let endEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(end);
    let moveProps = (0, $29Bzt$useMemo)(()=>{
        let moveProps = {};
        let start = ()=>{
            (0, $cbf007e418543821$export$16a4697467175487)();
            state.current.didMove = false;
        };
        if (typeof PointerEvent === 'undefined' && process.env.NODE_ENV === 'test') {
            let onMouseMove = (e)=>{
                if (e.button === 0) {
                    // Should be safe to use the useEffectEvent because these are equivalent https://github.com/reactjs/react.dev/issues/8075#issuecomment-3400179389
                    // However, the compiler is not smart enough to know that. As such, this whole file must be manually optimised as the compiler will bail.
                    //
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, 'mouse', e.pageX - (state.current.lastPosition?.pageX ?? 0), e.pageY - (state.current.lastPosition?.pageY ?? 0));
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                }
            };
            let onMouseUp = (e)=>{
                if (e.button === 0) {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    endEvent(e, 'mouse');
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                    removeGlobalListener(ownerWindow, 'mousemove', onMouseMove, false);
                    removeGlobalListener(ownerWindow, 'mouseup', onMouseUp, false);
                }
            };
            moveProps.onMouseDown = (e)=>{
                if (e.button === 0) {
                    start();
                    e.stopPropagation();
                    e.preventDefault();
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                    addGlobalListener(ownerWindow, 'mousemove', onMouseMove, false);
                    addGlobalListener(ownerWindow, 'mouseup', onMouseUp, false);
                }
            };
            let onTouchMove = (e)=>{
                let touch = [
                    ...e.changedTouches
                ].findIndex(({ identifier: identifier })=>identifier === state.current.id);
                if (touch >= 0) {
                    let { pageX: pageX, pageY: pageY } = e.changedTouches[touch];
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, 'touch', pageX - (state.current.lastPosition?.pageX ?? 0), pageY - (state.current.lastPosition?.pageY ?? 0));
                    state.current.lastPosition = {
                        pageX: pageX,
                        pageY: pageY
                    };
                }
            };
            let onTouchEnd = (e)=>{
                let touch = [
                    ...e.changedTouches
                ].findIndex(({ identifier: identifier })=>identifier === state.current.id);
                if (touch >= 0) {
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    endEvent(e, 'touch');
                    state.current.id = null;
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                    removeGlobalListener(ownerWindow, 'touchmove', onTouchMove);
                    removeGlobalListener(ownerWindow, 'touchend', onTouchEnd);
                    removeGlobalListener(ownerWindow, 'touchcancel', onTouchEnd);
                }
            };
            moveProps.onTouchStart = (e)=>{
                if (e.changedTouches.length === 0 || state.current.id != null) return;
                let { pageX: pageX, pageY: pageY, identifier: identifier } = e.changedTouches[0];
                start();
                e.stopPropagation();
                e.preventDefault();
                state.current.lastPosition = {
                    pageX: pageX,
                    pageY: pageY
                };
                state.current.id = identifier;
                let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                addGlobalListener(ownerWindow, 'touchmove', onTouchMove, false);
                addGlobalListener(ownerWindow, 'touchend', onTouchEnd, false);
                addGlobalListener(ownerWindow, 'touchcancel', onTouchEnd, false);
            };
        } else {
            let onPointerMove = (e)=>{
                if (e.pointerId === state.current.id) {
                    let pointerType = e.pointerType || 'mouse';
                    // Problems with PointerEvent#movementX/movementY:
                    // 1. it is always 0 on macOS Safari.
                    // 2. On Chrome Android, it's scaled by devicePixelRatio, but not on Chrome macOS
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, pointerType, e.pageX - (state.current.lastPosition?.pageX ?? 0), e.pageY - (state.current.lastPosition?.pageY ?? 0));
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                }
            };
            let onPointerUp = (e)=>{
                if (e.pointerId === state.current.id) {
                    let pointerType = e.pointerType || 'mouse';
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    endEvent(e, pointerType);
                    state.current.id = null;
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                    removeGlobalListener(ownerWindow, 'pointermove', onPointerMove, false);
                    removeGlobalListener(ownerWindow, 'pointerup', onPointerUp, false);
                    removeGlobalListener(ownerWindow, 'pointercancel', onPointerUp, false);
                }
            };
            moveProps.onPointerDown = (e)=>{
                if (e.button === 0 && state.current.id == null) {
                    start();
                    e.stopPropagation();
                    e.preventDefault();
                    state.current.lastPosition = {
                        pageX: e.pageX,
                        pageY: e.pageY
                    };
                    state.current.id = e.pointerId;
                    let ownerWindow = (0, $d447af545b77c9f1$export$f21a1ffae260145a)((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
                    addGlobalListener(ownerWindow, 'pointermove', onPointerMove, false);
                    addGlobalListener(ownerWindow, 'pointerup', onPointerUp, false);
                    addGlobalListener(ownerWindow, 'pointercancel', onPointerUp, false);
                }
            };
        }
        let triggerKeyboardMove = (e, deltaX, deltaY)=>{
            start();
            // eslint-disable-next-line react-hooks/rules-of-hooks
            moveEvent(e, 'keyboard', deltaX, deltaY);
            // eslint-disable-next-line react-hooks/rules-of-hooks
            endEvent(e, 'keyboard');
        };
        moveProps.onKeyDown = (e)=>{
            switch(e.key){
                case 'Left':
                case 'ArrowLeft':
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, -1, 0);
                    break;
                case 'Right':
                case 'ArrowRight':
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 1, 0);
                    break;
                case 'Up':
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 0, -1);
                    break;
                case 'Down':
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    triggerKeyboardMove(e, 0, 1);
                    break;
            }
        };
        return moveProps;
    }, [
        addGlobalListener,
        removeGlobalListener,
        state
    ]);
    return {
        moveProps: moveProps
    };
}


export {$1dfdc54e7eb53ba0$export$36da96379f79f245 as useMove};
//# sourceMappingURL=useMove.mjs.map
