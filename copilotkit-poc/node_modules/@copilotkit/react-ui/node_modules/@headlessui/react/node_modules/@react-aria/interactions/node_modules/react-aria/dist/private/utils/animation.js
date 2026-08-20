import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "./useLayoutEffect.js";
import {flushSync as $7ueWv$flushSync} from "react-dom";
import {useState as $7ueWv$useState, useCallback as $7ueWv$useCallback} from "react";

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


function $3c19e3d939575a21$export$6d3443f2c48bfc20(ref, isReady = true) {
    let [isEntering, setEntering] = (0, $7ueWv$useState)(true);
    let isAnimationReady = isEntering && isReady;
    // There are two cases for entry animations:
    // 1. CSS @keyframes. The `animation` property is set during the isEntering state, and it is removed after the animation finishes.
    // 2. CSS transitions. The initial styles are applied during the isEntering state, and removed immediately, causing the transition to occur.
    //
    // In the second case, cancel any transitions that were triggered prior to the isEntering = false state (when the transition is supposed to start).
    // This can happen when isReady starts as false (e.g. popovers prior to placement calculation).
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (isAnimationReady && ref.current && 'getAnimations' in ref.current) {
            for (let animation of ref.current.getAnimations())if (animation instanceof CSSTransition) animation.cancel();
        }
    }, [
        ref,
        isAnimationReady
    ]);
    $3c19e3d939575a21$var$useAnimation(ref, isAnimationReady, (0, $7ueWv$useCallback)(()=>setEntering(false), []));
    return isAnimationReady;
}
function $3c19e3d939575a21$export$45fda7c47f93fd48(ref, isOpen) {
    let [exitState, setExitState] = (0, $7ueWv$useState)(isOpen ? 'open' : 'closed');
    switch(exitState){
        case 'open':
            // If isOpen becomes false, set the state to exiting.
            if (!isOpen) setExitState('exiting');
            break;
        case 'closed':
        case 'exiting':
            // If we are exiting and isOpen becomes true, the animation was interrupted.
            // Reset the state to open.
            if (isOpen) setExitState('open');
            break;
    }
    let isExiting = exitState === 'exiting';
    $3c19e3d939575a21$var$useAnimation(ref, isExiting, (0, $7ueWv$useCallback)(()=>{
        // Set the state to closed, which will cause the element to be unmounted.
        setExitState((state)=>state === 'exiting' ? 'closed' : state);
    }, []));
    return isExiting;
}
function $3c19e3d939575a21$var$useAnimation(ref, isActive, onEnd) {
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (isActive && ref.current) {
            if (!('getAnimations' in ref.current)) {
                // JSDOM
                onEnd();
                return;
            }
            let animations = ref.current.getAnimations();
            if (animations.length === 0) {
                onEnd();
                return;
            }
            let canceled = false;
            Promise.allSettled(animations.map((a)=>a.finished)).then(()=>{
                if (!canceled) (0, $7ueWv$flushSync)(()=>{
                    onEnd();
                });
            });
            return ()=>{
                canceled = true;
            };
        }
    }, [
        ref,
        isActive,
        onEnd
    ]);
}


export {$3c19e3d939575a21$export$6d3443f2c48bfc20 as useEnterAnimation, $3c19e3d939575a21$export$45fda7c47f93fd48 as useExitAnimation};
//# sourceMappingURL=animation.js.map
