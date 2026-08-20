var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $25c7fefe1bb8073e$exports = require("../ssr/SSRProvider.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $2caKR$reactdom = require("react-dom");
var $2caKR$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDisclosure", function () { return $c381658a388f70e2$export$6e3e27031a30522f; });
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





function $c381658a388f70e2$export$6e3e27031a30522f(props, state, ref) {
    let { isDisabled: isDisabled } = props;
    let triggerId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let panelId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let isSSR = (0, $25c7fefe1bb8073e$exports.useIsSSR)();
    let raf = (0, $2caKR$react.useRef)(null);
    let handleBeforeMatch = (0, $2caKR$react.useCallback)(()=>{
        // Wait a frame to revert browser's removal of hidden attribute
        raf.current = requestAnimationFrame(()=>{
            if (ref.current) ref.current.setAttribute('hidden', 'until-found');
        });
        // Force sync state update
        (0, $2caKR$reactdom.flushSync)(()=>{
            state.toggle();
        });
    }, [
        ref,
        state
    ]);
    // @ts-ignore https://github.com/facebook/react/pull/24741
    (0, $6e76e65001bbcda2$exports.useEvent)(ref, 'beforematch', handleBeforeMatch);
    let isExpandedRef = (0, $2caKR$react.useRef)(null);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
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
    (0, $2caKR$react.useEffect)(()=>{
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


//# sourceMappingURL=useDisclosure.cjs.map
