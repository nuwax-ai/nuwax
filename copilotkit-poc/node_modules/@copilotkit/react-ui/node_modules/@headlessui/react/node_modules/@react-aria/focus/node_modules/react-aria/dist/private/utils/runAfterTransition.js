import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "./shadowdom/DOMFunctions.js";

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
 */ // We store a global list of elements that are currently transitioning,
// mapped to a set of CSS properties that are transitioning for that element.
// This is necessary rather than a simple count of transitions because of browser
// bugs, e.g. Chrome sometimes fires both transitionend and transitioncancel rather
// than one or the other. So we need to track what's actually transitioning so that
// we can ignore these duplicate events.

let $aa33e9569e5401d5$var$transitionsByElement = new Map();
// A list of callbacks to call once there are no transitioning elements.
let $aa33e9569e5401d5$var$transitionCallbacks = new Set();
function $aa33e9569e5401d5$var$setupGlobalEvents() {
    if (typeof window === 'undefined') return;
    function isTransitionEvent(event) {
        return 'propertyName' in event;
    }
    let onTransitionStart = (e)=>{
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (!isTransitionEvent(e) || !eventTarget) return;
        // Add the transitioning property to the list for this element.
        let transitions = $aa33e9569e5401d5$var$transitionsByElement.get(eventTarget);
        if (!transitions) {
            transitions = new Set();
            $aa33e9569e5401d5$var$transitionsByElement.set(eventTarget, transitions);
            // The transitioncancel event must be registered on the element itself, rather than as a global
            // event. This enables us to handle when the node is deleted from the document while it is transitioning.
            // In that case, the cancel event would have nowhere to bubble to so we need to handle it directly.
            eventTarget.addEventListener('transitioncancel', onTransitionEnd, {
                once: true
            });
        }
        transitions.add(e.propertyName);
    };
    let onTransitionEnd = (e)=>{
        let eventTarget = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (!isTransitionEvent(e) || !eventTarget) return;
        // Remove property from list of transitioning properties.
        let properties = $aa33e9569e5401d5$var$transitionsByElement.get(eventTarget);
        if (!properties) return;
        properties.delete(e.propertyName);
        // If empty, remove transitioncancel event, and remove the element from the list of transitioning elements.
        if (properties.size === 0) {
            eventTarget.removeEventListener('transitioncancel', onTransitionEnd);
            $aa33e9569e5401d5$var$transitionsByElement.delete(eventTarget);
        }
        // If no transitioning elements, call all of the queued callbacks.
        if ($aa33e9569e5401d5$var$transitionsByElement.size === 0) {
            for (let cb of $aa33e9569e5401d5$var$transitionCallbacks)cb();
            $aa33e9569e5401d5$var$transitionCallbacks.clear();
        }
    };
    document.body.addEventListener('transitionrun', onTransitionStart);
    document.body.addEventListener('transitionend', onTransitionEnd);
}
if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') $aa33e9569e5401d5$var$setupGlobalEvents();
    else document.addEventListener('DOMContentLoaded', $aa33e9569e5401d5$var$setupGlobalEvents);
}
/**
 * Cleans up any elements that are no longer in the document.
 * This is necessary because we can't rely on transitionend events to fire
 * for elements that are removed from the document while transitioning.
 */ function $aa33e9569e5401d5$var$cleanupDetachedElements() {
    for (const [eventTarget] of $aa33e9569e5401d5$var$transitionsByElement)// Similar to `eventTarget instanceof Element && !eventTarget.isConnected`, but avoids
    // the explicit instanceof check, since it may be different in different contexts.
    if ('isConnected' in eventTarget && !eventTarget.isConnected) $aa33e9569e5401d5$var$transitionsByElement.delete(eventTarget);
}
function $aa33e9569e5401d5$export$24490316f764c430(fn) {
    // Wait one frame to see if an animation starts, e.g. a transition on mount.
    requestAnimationFrame(()=>{
        $aa33e9569e5401d5$var$cleanupDetachedElements();
        // If no transitions are running, call the function immediately.
        // Otherwise, add it to a list of callbacks to run at the end of the animation.
        if ($aa33e9569e5401d5$var$transitionsByElement.size === 0) fn();
        else $aa33e9569e5401d5$var$transitionCallbacks.add(fn);
    });
}


export {$aa33e9569e5401d5$export$24490316f764c430 as runAfterTransition};
//# sourceMappingURL=runAfterTransition.js.map
