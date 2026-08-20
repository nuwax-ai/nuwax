import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useState as $8r6Ck$useState, useCallback as $8r6Ck$useCallback, useEffect as $8r6Ck$useEffect} from "react";
import {useSyncExternalStore as $8r6Ck$useSyncExternalStore} from "use-sync-external-store/shim/index.js";

/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



// Increment this version number whenever the
// LandmarkManagerApi or Landmark interfaces change.
const $6b88d4883d4c7fe3$var$LANDMARK_API_VERSION = 1;
// Symbol under which the singleton landmark manager instance is attached to the document.
const $6b88d4883d4c7fe3$var$landmarkSymbol = Symbol.for('react-aria-landmark-manager');
function $6b88d4883d4c7fe3$var$subscribe(fn) {
    document.addEventListener('react-aria-landmark-manager-change', fn);
    return ()=>document.removeEventListener('react-aria-landmark-manager-change', fn);
}
function $6b88d4883d4c7fe3$var$getLandmarkManager() {
    if (typeof document === 'undefined') return null;
    // Reuse an existing instance if it has the same or greater version.
    let instance = document[$6b88d4883d4c7fe3$var$landmarkSymbol];
    if (instance && instance.version >= $6b88d4883d4c7fe3$var$LANDMARK_API_VERSION) return instance;
    // Otherwise, create a new instance and dispatch an event so anything using the existing
    // instance updates and re-registers their landmarks with the new one.
    document[$6b88d4883d4c7fe3$var$landmarkSymbol] = new $6b88d4883d4c7fe3$var$LandmarkManager();
    document.dispatchEvent(new CustomEvent('react-aria-landmark-manager-change'));
    return document[$6b88d4883d4c7fe3$var$landmarkSymbol];
}
// Subscribes a React component to the current landmark manager instance.
function $6b88d4883d4c7fe3$var$useLandmarkManager() {
    return (0, $8r6Ck$useSyncExternalStore)($6b88d4883d4c7fe3$var$subscribe, $6b88d4883d4c7fe3$var$getLandmarkManager, $6b88d4883d4c7fe3$var$getLandmarkManager);
}
class $6b88d4883d4c7fe3$var$LandmarkManager {
    constructor(){
        this.landmarks = [];
        this.isListening = false;
        this.refCount = 0;
        this.version = $6b88d4883d4c7fe3$var$LANDMARK_API_VERSION;
        this.f6Handler = this.f6Handler.bind(this);
        this.focusinHandler = this.focusinHandler.bind(this);
        this.focusoutHandler = this.focusoutHandler.bind(this);
    }
    setupIfNeeded() {
        if (this.isListening) return;
        document.addEventListener('keydown', this.f6Handler, {
            capture: true
        });
        document.addEventListener('focusin', this.focusinHandler, {
            capture: true
        });
        document.addEventListener('focusout', this.focusoutHandler, {
            capture: true
        });
        this.isListening = true;
    }
    teardownIfNeeded() {
        if (!this.isListening || this.landmarks.length > 0 || this.refCount > 0) return;
        document.removeEventListener('keydown', this.f6Handler, {
            capture: true
        });
        document.removeEventListener('focusin', this.focusinHandler, {
            capture: true
        });
        document.removeEventListener('focusout', this.focusoutHandler, {
            capture: true
        });
        this.isListening = false;
    }
    focusLandmark(landmark, direction) {
        this.landmarks.find((l)=>l.ref.current === landmark)?.focus?.(direction);
    }
    /**
   * Return set of landmarks with a specific role.
   */ getLandmarksByRole(role) {
        return new Set(this.landmarks.filter((l)=>l.role === role));
    }
    /**
   * Return first landmark with a specific role.
   */ getLandmarkByRole(role) {
        return this.landmarks.find((l)=>l.role === role);
    }
    addLandmark(newLandmark) {
        this.setupIfNeeded();
        if (this.landmarks.find((landmark)=>landmark.ref === newLandmark.ref) || !newLandmark.ref.current) return;
        if (this.landmarks.filter((landmark)=>landmark.role === 'main').length > 1 && process.env.NODE_ENV !== 'production') console.error('Page can contain no more than one landmark with the role "main".');
        if (this.landmarks.length === 0) {
            this.landmarks = [
                newLandmark
            ];
            this.checkLabels(newLandmark.role);
            return;
        }
        // Binary search to insert new landmark based on position in document relative to existing landmarks.
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
        let start = 0;
        let end = this.landmarks.length - 1;
        while(start <= end){
            let mid = Math.floor((start + end) / 2);
            let comparedPosition = newLandmark.ref.current.compareDocumentPosition(this.landmarks[mid].ref.current);
            let isNewAfterExisting = Boolean(comparedPosition & Node.DOCUMENT_POSITION_PRECEDING || comparedPosition & Node.DOCUMENT_POSITION_CONTAINS);
            if (isNewAfterExisting) start = mid + 1;
            else end = mid - 1;
        }
        this.landmarks.splice(start, 0, newLandmark);
        this.checkLabels(newLandmark.role);
    }
    updateLandmark(landmark) {
        let index = this.landmarks.findIndex((l)=>l.ref === landmark.ref);
        if (index >= 0) {
            this.landmarks[index] = {
                ...this.landmarks[index],
                ...landmark
            };
            this.checkLabels(this.landmarks[index].role);
        }
    }
    removeLandmark(ref) {
        this.landmarks = this.landmarks.filter((landmark)=>landmark.ref !== ref);
        this.teardownIfNeeded();
    }
    /**
   * Warn if there are 2+ landmarks with the same role but no label.
   * Labels for landmarks with the same role must also be unique.
   *
   * See https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/.
   */ checkLabels(role) {
        let landmarksWithRole = this.getLandmarksByRole(role);
        if (landmarksWithRole.size > 1) {
            let duplicatesWithoutLabel = [
                ...landmarksWithRole
            ].filter((landmark)=>!landmark.label);
            if (duplicatesWithoutLabel.length > 0 && process.env.NODE_ENV !== 'production') console.warn(`Page contains more than one landmark with the '${role}' role. If two or more landmarks on a page share the same role, all must be labeled with an aria-label or aria-labelledby attribute: `, duplicatesWithoutLabel.map((landmark)=>landmark.ref.current));
            else if (process.env.NODE_ENV !== 'production') {
                let labels = [
                    ...landmarksWithRole
                ].map((landmark)=>landmark.label);
                let duplicateLabels = labels.filter((item, index)=>labels.indexOf(item) !== index);
                duplicateLabels.forEach((label)=>{
                    console.warn(`Page contains more than one landmark with the '${role}' role and '${label}' label. If two or more landmarks on a page share the same role, they must have unique labels: `, [
                        ...landmarksWithRole
                    ].filter((landmark)=>landmark.label === label).map((landmark)=>landmark.ref.current));
                });
            }
        }
    }
    /**
   * Get the landmark that is the closest parent in the DOM.
   * Returns undefined if no parent is a landmark.
   */ closestLandmark(element) {
        let landmarkMap = new Map(this.landmarks.map((l)=>[
                l.ref.current,
                l
            ]));
        let currentElement = element;
        while(currentElement && !landmarkMap.has(currentElement) && currentElement !== document.body && currentElement.parentElement)currentElement = currentElement.parentElement;
        return landmarkMap.get(currentElement);
    }
    /**
   * Gets the next landmark, in DOM focus order, or previous if backwards is specified.
   * If last landmark, next should be the first landmark.
   * If not inside a landmark, will return first landmark.
   * Returns undefined if there are no landmarks.
   */ getNextLandmark(element, { backward: backward }) {
        let currentLandmark = this.closestLandmark(element);
        let nextLandmarkIndex = backward ? this.landmarks.length - 1 : 0;
        if (currentLandmark) nextLandmarkIndex = this.landmarks.indexOf(currentLandmark) + (backward ? -1 : 1);
        let wrapIfNeeded = ()=>{
            // When we reach the end of the landmark sequence, fire a custom event that can be listened for by applications.
            // If this event is canceled, we return immediately. This can be used to implement landmark navigation across iframes.
            if (nextLandmarkIndex < 0) {
                if (!element.dispatchEvent(new CustomEvent('react-aria-landmark-navigation', {
                    detail: {
                        direction: 'backward'
                    },
                    bubbles: true,
                    cancelable: true
                }))) return true;
                nextLandmarkIndex = this.landmarks.length - 1;
            } else if (nextLandmarkIndex >= this.landmarks.length) {
                if (!element.dispatchEvent(new CustomEvent('react-aria-landmark-navigation', {
                    detail: {
                        direction: 'forward'
                    },
                    bubbles: true,
                    cancelable: true
                }))) return true;
                nextLandmarkIndex = 0;
            }
            if (nextLandmarkIndex < 0 || nextLandmarkIndex >= this.landmarks.length) return true;
            return false;
        };
        if (wrapIfNeeded()) return undefined;
        // Skip over hidden landmarks.
        let i = nextLandmarkIndex;
        while(this.landmarks[nextLandmarkIndex].ref.current?.closest('[aria-hidden=true]')){
            nextLandmarkIndex += backward ? -1 : 1;
            if (wrapIfNeeded()) return undefined;
            if (nextLandmarkIndex === i) break;
        }
        return this.landmarks[nextLandmarkIndex];
    }
    /**
   * Look at next landmark. If an element was previously focused inside, restore focus there.
   * If not, focus the landmark itself.
   * If no landmarks at all, or none with focusable elements, don't move focus.
   */ f6Handler(e) {
        if (e.key === 'F6') {
            // If alt key pressed, focus main landmark, otherwise navigate forward or backward based on shift key.
            let handled = e.altKey ? this.focusMain() : this.navigate((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e), e.shiftKey);
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }
    focusMain() {
        let main = this.getLandmarkByRole('main');
        if (main && main.ref.current && main.ref.current.isConnected) {
            this.focusLandmark(main.ref.current, 'forward');
            return true;
        }
        return false;
    }
    navigate(from, backward) {
        let nextLandmark = this.getNextLandmark(from, {
            backward: backward
        });
        if (!nextLandmark) return false;
        // If something was previously focused in the next landmark, then return focus to it
        if (nextLandmark.lastFocused) {
            let lastFocused = nextLandmark.lastFocused;
            if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(document.body, lastFocused)) {
                lastFocused.focus();
                return true;
            }
        }
        // Otherwise, focus the landmark itself
        if (nextLandmark.ref.current && nextLandmark.ref.current.isConnected) {
            this.focusLandmark(nextLandmark.ref.current, backward ? 'backward' : 'forward');
            return true;
        }
        return false;
    }
    /**
   * Sets lastFocused for a landmark, if focus is moved within that landmark.
   * Lets the last focused landmark know it was blurred if something else is focused.
   */ focusinHandler(e) {
        let currentLandmark = this.closestLandmark((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e));
        if (currentLandmark && currentLandmark.ref.current !== (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) this.updateLandmark({
            ref: currentLandmark.ref,
            lastFocused: (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)
        });
        let previousFocusedElement = e.relatedTarget;
        if (previousFocusedElement) {
            let closestPreviousLandmark = this.closestLandmark(previousFocusedElement);
            if (closestPreviousLandmark && closestPreviousLandmark.ref.current === previousFocusedElement) closestPreviousLandmark.blur();
        }
    }
    /**
   * Track if the focus is lost to the body. If it is, do cleanup on the landmark that last had
   * focus.
   */ focusoutHandler(e) {
        let previousFocusedElement = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
        let nextFocusedElement = e.relatedTarget;
        // the === document seems to be a jest thing for focus to go there on generic blur event such as landmark.blur();
        // browsers appear to send focus instead to document.body and the relatedTarget is null when that happens
        if (!nextFocusedElement || nextFocusedElement === document) {
            let closestPreviousLandmark = this.closestLandmark(previousFocusedElement);
            if (closestPreviousLandmark && closestPreviousLandmark.ref.current === previousFocusedElement) closestPreviousLandmark.blur();
        }
    }
    createLandmarkController() {
        let instance = this;
        instance.refCount++;
        instance.setupIfNeeded();
        return {
            navigate (direction, opts) {
                let element = opts?.from || document.activeElement;
                return instance.navigate(element, direction === 'backward');
            },
            focusNext (opts) {
                let element = opts?.from || document.activeElement;
                return instance.navigate(element, false);
            },
            focusPrevious (opts) {
                let element = opts?.from || document.activeElement;
                return instance.navigate(element, true);
            },
            focusMain () {
                return instance.focusMain();
            },
            dispose () {
                if (instance) {
                    instance.refCount--;
                    instance.teardownIfNeeded();
                    instance = null;
                }
            }
        };
    }
    registerLandmark(landmark) {
        if (this.landmarks.find((l)=>l.ref === landmark.ref)) this.updateLandmark(landmark);
        else this.addLandmark(landmark);
        return ()=>this.removeLandmark(landmark.ref);
    }
}
function $6b88d4883d4c7fe3$export$a8e2debc6521490c() {
    // Get the current landmark manager and create a controller using it.
    let instance = $6b88d4883d4c7fe3$var$getLandmarkManager();
    let controller = instance?.createLandmarkController();
    let unsubscribe = $6b88d4883d4c7fe3$var$subscribe(()=>{
        // If the landmark manager changes, dispose the old
        // controller and create a new one.
        controller?.dispose();
        instance = $6b88d4883d4c7fe3$var$getLandmarkManager();
        controller = instance?.createLandmarkController();
    });
    // Return a wrapper that proxies requests to the current controller instance.
    return {
        navigate (direction, opts) {
            return controller.navigate(direction, opts);
        },
        focusNext (opts) {
            return controller.focusNext(opts);
        },
        focusPrevious (opts) {
            return controller.focusPrevious(opts);
        },
        focusMain () {
            return controller.focusMain();
        },
        dispose () {
            controller?.dispose();
            unsubscribe();
            controller = undefined;
            instance = null;
        }
    };
}
function $6b88d4883d4c7fe3$export$4cc632584fd87fae(props, ref) {
    const { role: role, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, focus: focus } = props;
    let manager = $6b88d4883d4c7fe3$var$useLandmarkManager();
    let label = ariaLabel || ariaLabelledby;
    let [isLandmarkFocused, setIsLandmarkFocused] = (0, $8r6Ck$useState)(false);
    let defaultFocus = (0, $8r6Ck$useCallback)(()=>{
        setIsLandmarkFocused(true);
    }, [
        setIsLandmarkFocused
    ]);
    let blur = (0, $8r6Ck$useCallback)(()=>{
        setIsLandmarkFocused(false);
    }, [
        setIsLandmarkFocused
    ]);
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        if (manager) return manager.registerLandmark({
            ref: ref,
            label: label,
            role: role,
            focus: focus || defaultFocus,
            blur: blur
        });
    }, [
        manager,
        label,
        ref,
        role,
        focus,
        defaultFocus,
        blur
    ]);
    (0, $8r6Ck$useEffect)(()=>{
        if (isLandmarkFocused) ref.current?.focus();
    }, [
        isLandmarkFocused,
        ref
    ]);
    return {
        landmarkProps: {
            role: role,
            tabIndex: isLandmarkFocused ? -1 : undefined,
            'aria-label': ariaLabel,
            'aria-labelledby': ariaLabelledby
        }
    };
}


export {$6b88d4883d4c7fe3$export$a8e2debc6521490c as UNSTABLE_createLandmarkController, $6b88d4883d4c7fe3$export$4cc632584fd87fae as useLandmark};
//# sourceMappingURL=useLandmark.mjs.map
