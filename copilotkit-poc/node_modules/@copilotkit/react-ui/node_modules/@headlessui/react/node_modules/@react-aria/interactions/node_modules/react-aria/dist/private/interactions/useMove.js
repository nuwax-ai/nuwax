import {disableTextSelection as $913e9bb378fa8235$export$16a4697467175487, restoreTextSelection as $913e9bb378fa8235$export$b0d6fa1ab32e3295} from "./textSelection.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useRef as $eYoeV$useRef, useCallback as $eYoeV$useCallback, useMemo as $eYoeV$useMemo} from "react";

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





function $e7c7f5ffbc8157af$export$36da96379f79f245(props) {
    let { onMoveStart: onMoveStart, onMove: onMove, onMoveEnd: onMoveEnd } = props;
    let state = (0, $eYoeV$useRef)({
        didMove: false,
        lastPosition: null,
        id: null
    });
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let move = (0, $eYoeV$useCallback)((originalEvent, pointerType, deltaX, deltaY)=>{
        if (deltaX === 0 && deltaY === 0) return;
        if (!state.current.didMove) {
            state.current.didMove = true;
            onMoveStart === null || onMoveStart === void 0 ? void 0 : onMoveStart({
                type: 'movestart',
                pointerType: pointerType,
                shiftKey: originalEvent.shiftKey,
                metaKey: originalEvent.metaKey,
                ctrlKey: originalEvent.ctrlKey,
                altKey: originalEvent.altKey
            });
        }
        onMove === null || onMove === void 0 ? void 0 : onMove({
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
    let moveEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(move);
    let end = (0, $eYoeV$useCallback)((originalEvent, pointerType)=>{
        (0, $913e9bb378fa8235$export$b0d6fa1ab32e3295)();
        if (state.current.didMove) onMoveEnd === null || onMoveEnd === void 0 ? void 0 : onMoveEnd({
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
    let endEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(end);
    let moveProps = (0, $eYoeV$useMemo)(()=>{
        let moveProps = {};
        let start = ()=>{
            (0, $913e9bb378fa8235$export$16a4697467175487)();
            state.current.didMove = false;
        };
        if (typeof PointerEvent === 'undefined' && process.env.NODE_ENV === 'test') {
            let onMouseMove = (e)=>{
                if (e.button === 0) {
                    var _state_current_lastPosition, _state_current_lastPosition1;
                    var _state_current_lastPosition_pageX, _state_current_lastPosition_pageY;
                    // Should be safe to use the useEffectEvent because these are equivalent https://github.com/reactjs/react.dev/issues/8075#issuecomment-3400179389
                    // However, the compiler is not smart enough to know that. As such, this whole file must be manually optimised as the compiler will bail.
                    //
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, 'mouse', e.pageX - ((_state_current_lastPosition_pageX = (_state_current_lastPosition = state.current.lastPosition) === null || _state_current_lastPosition === void 0 ? void 0 : _state_current_lastPosition.pageX) !== null && _state_current_lastPosition_pageX !== void 0 ? _state_current_lastPosition_pageX : 0), e.pageY - ((_state_current_lastPosition_pageY = (_state_current_lastPosition1 = state.current.lastPosition) === null || _state_current_lastPosition1 === void 0 ? void 0 : _state_current_lastPosition1.pageY) !== null && _state_current_lastPosition_pageY !== void 0 ? _state_current_lastPosition_pageY : 0));
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
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
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
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
                    addGlobalListener(ownerWindow, 'mousemove', onMouseMove, false);
                    addGlobalListener(ownerWindow, 'mouseup', onMouseUp, false);
                }
            };
            let onTouchMove = (e)=>{
                let touch = [
                    ...e.changedTouches
                ].findIndex(({ identifier: identifier })=>identifier === state.current.id);
                if (touch >= 0) {
                    var _state_current_lastPosition, _state_current_lastPosition1;
                    let { pageX: pageX, pageY: pageY } = e.changedTouches[touch];
                    var _state_current_lastPosition_pageX, _state_current_lastPosition_pageY;
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, 'touch', pageX - ((_state_current_lastPosition_pageX = (_state_current_lastPosition = state.current.lastPosition) === null || _state_current_lastPosition === void 0 ? void 0 : _state_current_lastPosition.pageX) !== null && _state_current_lastPosition_pageX !== void 0 ? _state_current_lastPosition_pageX : 0), pageY - ((_state_current_lastPosition_pageY = (_state_current_lastPosition1 = state.current.lastPosition) === null || _state_current_lastPosition1 === void 0 ? void 0 : _state_current_lastPosition1.pageY) !== null && _state_current_lastPosition_pageY !== void 0 ? _state_current_lastPosition_pageY : 0));
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
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
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
                let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
                addGlobalListener(ownerWindow, 'touchmove', onTouchMove, false);
                addGlobalListener(ownerWindow, 'touchend', onTouchEnd, false);
                addGlobalListener(ownerWindow, 'touchcancel', onTouchEnd, false);
            };
        } else {
            let onPointerMove = (e)=>{
                if (e.pointerId === state.current.id) {
                    var _state_current_lastPosition, _state_current_lastPosition1;
                    let pointerType = e.pointerType || 'mouse';
                    var _state_current_lastPosition_pageX, _state_current_lastPosition_pageY;
                    // Problems with PointerEvent#movementX/movementY:
                    // 1. it is always 0 on macOS Safari.
                    // 2. On Chrome Android, it's scaled by devicePixelRatio, but not on Chrome macOS
                    // eslint-disable-next-line react-hooks/rules-of-hooks
                    moveEvent(e, pointerType, e.pageX - ((_state_current_lastPosition_pageX = (_state_current_lastPosition = state.current.lastPosition) === null || _state_current_lastPosition === void 0 ? void 0 : _state_current_lastPosition.pageX) !== null && _state_current_lastPosition_pageX !== void 0 ? _state_current_lastPosition_pageX : 0), e.pageY - ((_state_current_lastPosition_pageY = (_state_current_lastPosition1 = state.current.lastPosition) === null || _state_current_lastPosition1 === void 0 ? void 0 : _state_current_lastPosition1.pageY) !== null && _state_current_lastPosition_pageY !== void 0 ? _state_current_lastPosition_pageY : 0));
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
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
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
                    let ownerWindow = (0, $cc3c3666b64debad$export$f21a1ffae260145a)((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e));
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


export {$e7c7f5ffbc8157af$export$36da96379f79f245 as useMove};
//# sourceMappingURL=useMove.js.map
