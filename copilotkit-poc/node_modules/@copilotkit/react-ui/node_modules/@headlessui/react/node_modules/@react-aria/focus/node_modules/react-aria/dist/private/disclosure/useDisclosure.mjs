import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "../utils/useEvent.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useIsSSR as $c7eafbbe1ea5834e$export$535bd6ca7f90a273} from "../ssr/SSRProvider.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {flushSync as $cbhof$flushSync} from "react-dom";
import {useRef as $cbhof$useRef, useCallback as $cbhof$useCallback, useEffect as $cbhof$useEffect} from "react";

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





function $89a3495b7d82e671$export$6e3e27031a30522f(props, state, ref) {
    let { isDisabled: isDisabled } = props;
    let triggerId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let panelId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let isSSR = (0, $c7eafbbe1ea5834e$export$535bd6ca7f90a273)();
    let raf = (0, $cbhof$useRef)(null);
    let handleBeforeMatch = (0, $cbhof$useCallback)(()=>{
        // Wait a frame to revert browser's removal of hidden attribute
        raf.current = requestAnimationFrame(()=>{
            if (ref.current) ref.current.setAttribute('hidden', 'until-found');
        });
        // Force sync state update
        (0, $cbhof$flushSync)(()=>{
            state.toggle();
        });
    }, [
        ref,
        state
    ]);
    // @ts-ignore https://github.com/facebook/react/pull/24741
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(ref, 'beforematch', handleBeforeMatch);
    let isExpandedRef = (0, $cbhof$useRef)(null);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
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
    (0, $cbhof$useEffect)(()=>{
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


export {$89a3495b7d82e671$export$6e3e27031a30522f as useDisclosure};
//# sourceMappingURL=useDisclosure.mjs.map
