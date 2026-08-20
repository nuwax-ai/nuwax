import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useIsSSR as $85138adc03e1f057$export$535bd6ca7f90a273} from "../ssr/SSRProvider.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {flushSync as $fP5FB$flushSync} from "react-dom";
import {useRef as $fP5FB$useRef, useCallback as $fP5FB$useCallback, useEffect as $fP5FB$useEffect} from "react";

/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 





function $0009ddef725d8da3$export$6e3e27031a30522f(props, state, ref) {
    let { isDisabled: isDisabled } = props;
    let triggerId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let panelId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let isSSR = (0, $85138adc03e1f057$export$535bd6ca7f90a273)();
    let raf = (0, $fP5FB$useRef)(null);
    let handleBeforeMatch = (0, $fP5FB$useCallback)(()=>{
        // Wait a frame to revert browser's removal of hidden attribute
        raf.current = requestAnimationFrame(()=>{
            if (ref.current) ref.current.setAttribute('hidden', 'until-found');
        });
        // Force sync state update
        (0, $fP5FB$flushSync)(()=>{
            state.toggle();
        });
    }, [
        ref,
        state
    ]);
    // @ts-ignore https://github.com/facebook/react/pull/24741
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, 'beforematch', handleBeforeMatch);
    let isExpandedRef = (0, $fP5FB$useRef)(null);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        // Cancel any pending RAF to prevent stale updates
        if (raf.current) cancelAnimationFrame(raf.current);
        if (ref.current && !isSSR) {
            let panel = ref.current;
            if (isExpandedRef.current == null || typeof panel.getAnimations !== 'function') {
                // On initial render (and in tests), set attributes without animation.
                if (state.isExpanded) {
                    panel.removeAttribute('hidden');
                    panel.style.setProperty('--disclosure-panel-width', 'auto');
                    panel.style.setProperty('--disclosure-panel-height', 'auto');
                } else {
                    panel.setAttribute('hidden', 'until-found');
                    panel.style.setProperty('--disclosure-panel-width', '0px');
                    panel.style.setProperty('--disclosure-panel-height', '0px');
                }
            } else if (state.isExpanded !== isExpandedRef.current) {
                if (state.isExpanded) {
                    panel.removeAttribute('hidden');
                    // Set the width and height as pixels so they can be animated.
                    panel.style.setProperty('--disclosure-panel-width', panel.scrollWidth + 'px');
                    panel.style.setProperty('--disclosure-panel-height', panel.scrollHeight + 'px');
                    Promise.all(panel.getAnimations().map((a)=>a.finished)).then(()=>{
                        // After the animations complete, switch back to auto so the content can resize.
                        panel.style.setProperty('--disclosure-panel-width', 'auto');
                        panel.style.setProperty('--disclosure-panel-height', 'auto');
                    }).catch(()=>{});
                } else {
                    panel.style.setProperty('--disclosure-panel-width', panel.scrollWidth + 'px');
                    panel.style.setProperty('--disclosure-panel-height', panel.scrollHeight + 'px');
                    // Force style re-calculation to trigger animations.
                    window.getComputedStyle(panel).height;
                    // Animate to zero size.
                    panel.style.setProperty('--disclosure-panel-width', '0px');
                    panel.style.setProperty('--disclosure-panel-height', '0px');
                    // Wait for animations to apply the hidden attribute.
                    Promise.all(panel.getAnimations().map((a)=>a.finished)).then(()=>panel.setAttribute('hidden', 'until-found')).catch(()=>{});
                }
            }
            isExpandedRef.current = state.isExpanded;
        }
    }, [
        isDisabled,
        ref,
        state.isExpanded,
        isSSR
    ]);
    (0, $fP5FB$useEffect)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, []);
    return {
        buttonProps: {
            id: triggerId,
            'aria-expanded': state.isExpanded,
            'aria-controls': panelId,
            onPress: (e)=>{
                if (!isDisabled && e.pointerType !== 'keyboard') state.toggle();
            },
            isDisabled: isDisabled,
            onPressStart (e) {
                if (e.pointerType === 'keyboard' && !isDisabled) state.toggle();
            }
        },
        panelProps: {
            id: panelId,
            // This can be overridden at the panel element level.
            role: 'group',
            'aria-labelledby': triggerId,
            'aria-hidden': !state.isExpanded,
            hidden: isSSR ? !state.isExpanded : undefined
        }
    };
}


export {$0009ddef725d8da3$export$6e3e27031a30522f as useDisclosure};
//# sourceMappingURL=useDisclosure.js.map
