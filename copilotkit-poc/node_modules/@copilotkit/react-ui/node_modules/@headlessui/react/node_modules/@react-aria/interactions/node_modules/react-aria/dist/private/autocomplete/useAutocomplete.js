import {CLEAR_FOCUS_EVENT as $7376cba1b89d16ef$export$447a38995de2c711, FOCUS_EVENT as $7376cba1b89d16ef$export$831c820ad60f9d12} from "../utils/constants.js";
import {dispatchVirtualBlur as $57a86975180d30a8$export$6c5dc7e81d2cc29a, dispatchVirtualFocus as $57a86975180d30a8$export$2b35b76d2e30e129, getVirtuallyFocusedElement as $57a86975180d30a8$export$759df0d867455a91, moveVirtualFocus as $57a86975180d30a8$export$76e4e37e5339496d} from "../focus/virtualFocus.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9, getPointerType as $b50b1cc8a843ace7$export$887a228355cf7d95} from "../interactions/useFocusVisible.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";
import $8FiQn$intlStringsjs from "./intlStrings.js";
import {isAndroid as $d5a2be505488529f$export$a11b0059900ceec8, isIOS as $d5a2be505488529f$export$fedb369cb70207f1} from "../utils/platform.js";
import {isCtrlKeyPressed as $2224c9ee07fd529d$export$16792effe837dba3} from "../utils/keyboard.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {mergeRefs as $d49e67a55e1d0418$export$c9058316764c140e} from "../utils/mergeRefs.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useObjectRef as $5f169cf7bc5a96a9$export$4338b53315abf666} from "../utils/useObjectRef.js";
import {useRef as $8FiQn$useRef, useState as $8FiQn$useState, useEffect as $8FiQn$useEffect, useCallback as $8FiQn$useCallback, useMemo as $8FiQn$useMemo} from "react";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

















function $e9f66e10c06d1e5c$export$1e40b3ca02d92d21(props, state) {
    let { inputRef: inputRef, collectionRef: collectionRef, filter: filter, disableAutoFocusFirst: disableAutoFocusFirst = false, disableVirtualFocus: disableVirtualFocus = false } = props;
    let collectionId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let timeout = (0, $8FiQn$useRef)(undefined);
    let delayNextActiveDescendant = (0, $8FiQn$useRef)(false);
    let queuedActiveDescendant = (0, $8FiQn$useRef)(null);
    // For mobile screen readers, we don't want virtual focus, instead opting to disable FocusScope's restoreFocus and manually
    // moving focus back to the subtriggers
    let isMobileScreenReader = (0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() === 'virtual' && ((0, $d5a2be505488529f$export$fedb369cb70207f1)() || (0, $d5a2be505488529f$export$a11b0059900ceec8)());
    let [shouldUseVirtualFocus, setShouldUseVirtualFocus] = (0, $8FiQn$useState)(!isMobileScreenReader && !disableVirtualFocus);
    // Tracks if a collection has been connected to the autocomplete. If false, we don't want to add various attributes to the autocomplete input
    // since it isn't attached to a filterable collection (e.g. Tabs)
    let [hasCollection, setHasCollection] = (0, $8FiQn$useState)(false);
    (0, $8FiQn$useEffect)(()=>{
        return ()=>clearTimeout(timeout.current);
    }, []);
    let updateActiveDescendantEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        // Ensure input is focused if the user clicks on the collection directly.
        // don't trigger on touch so that mobile keyboard doesnt appear when tapping on options
        if (!e.isTrusted && shouldUseVirtualFocus && inputRef.current && (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)((0, $cc3c3666b64debad$export$b204af158042fbac)(inputRef.current)) !== inputRef.current && (0, $b50b1cc8a843ace7$export$887a228355cf7d95)() !== 'touch') inputRef.current.focus();
        let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (e.isTrusted || !target || queuedActiveDescendant.current === target.id) return;
        clearTimeout(timeout.current);
        if (target !== collectionRef.current) {
            if (delayNextActiveDescendant.current) {
                queuedActiveDescendant.current = target.id;
                timeout.current = setTimeout(()=>{
                    state.setFocusedNodeId(target.id);
                }, 500);
            } else {
                queuedActiveDescendant.current = target.id;
                state.setFocusedNodeId(target.id);
            }
        } else if (queuedActiveDescendant.current && !document.getElementById(queuedActiveDescendant.current)) {
            // If we recieve a focus event refocusing the collection, either we have newly refocused the input and are waiting for the
            // wrapped collection to refocus the previously focused node if any OR
            // we are in a state where we've filtered to such a point that there aren't any matching items in the collection to focus.
            // In this case we want to clear tracked item if any and clear active descendant
            queuedActiveDescendant.current = null;
            state.setFocusedNodeId(null);
        }
        delayNextActiveDescendant.current = false;
    });
    let [collectionNode, setCollectionNode] = (0, $8FiQn$useState)(null);
    let callbackRef = (0, $8FiQn$useCallback)((node)=>{
        setCollectionNode(node);
        if (node != null) {
            // If useSelectableCollection isn't passed shouldUseVirtualFocus even when useAutocomplete provides it
            // that means the collection doesn't support it (e.g. Table). If that is the case, we need to disable it here regardless
            // of what the user's provided so that the input doesn't recieve the onKeyDown and autocomplete props.
            if (node.getAttribute('tabindex') != null) setShouldUseVirtualFocus(false);
            setHasCollection(true);
        } else setHasCollection(false);
    }, []);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (collectionNode != null) // When typing forward, we want to delay the setting of active descendant to not interrupt the native screen reader announcement
        // of the letter you just typed. If we recieve another focus event then we clear the queued update
        collectionNode.addEventListener('focusin', updateActiveDescendantEvent);
        return ()=>{
            collectionNode === null || collectionNode === void 0 ? void 0 : collectionNode.removeEventListener('focusin', updateActiveDescendantEvent);
        };
    }, [
        collectionNode
    ]);
    // Make sure to memo so that React doesn't keep registering a new event listeners on every rerender of the wrapped collection
    let mergedCollectionRef = (0, $5f169cf7bc5a96a9$export$4338b53315abf666)((0, $8FiQn$useMemo)(()=>(0, $d49e67a55e1d0418$export$c9058316764c140e)(collectionRef, callbackRef), [
        collectionRef,
        callbackRef
    ]));
    let focusFirstItem = (0, $8FiQn$useCallback)(()=>{
        var _collectionRef_current;
        delayNextActiveDescendant.current = true;
        (_collectionRef_current = collectionRef.current) === null || _collectionRef_current === void 0 ? void 0 : _collectionRef_current.dispatchEvent(new CustomEvent((0, $7376cba1b89d16ef$export$831c820ad60f9d12), {
            cancelable: true,
            bubbles: true,
            detail: {
                focusStrategy: 'first'
            }
        }));
    }, [
        collectionRef
    ]);
    let clearVirtualFocus = (0, $8FiQn$useCallback)((clearFocusKey)=>{
        var _collectionRef_current;
        (0, $57a86975180d30a8$export$76e4e37e5339496d)((0, $d8ac7ed472840322$export$cd4e5573fbe2b576)());
        queuedActiveDescendant.current = null;
        state.setFocusedNodeId(null);
        let clearFocusEvent = new CustomEvent((0, $7376cba1b89d16ef$export$447a38995de2c711), {
            cancelable: true,
            bubbles: true,
            detail: {
                clearFocusKey: clearFocusKey
            }
        });
        clearTimeout(timeout.current);
        delayNextActiveDescendant.current = false;
        (_collectionRef_current = collectionRef.current) === null || _collectionRef_current === void 0 ? void 0 : _collectionRef_current.dispatchEvent(clearFocusEvent);
    }, [
        collectionRef,
        state
    ]);
    let lastInputType = (0, $8FiQn$useRef)('');
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(inputRef, 'input', (e)=>{
        let { inputType: inputType } = e;
        lastInputType.current = inputType;
    });
    let onChange = (value)=>{
        // Tell wrapped collection to focus the first element in the list when typing forward and to clear focused key when modifying the text via
        // copy paste/backspacing/undo/redo for screen reader announcements
        if (lastInputType.current === 'insertText' && !disableAutoFocusFirst) focusFirstItem();
        else if (lastInputType.current && (lastInputType.current.includes('insert') || lastInputType.current.includes('delete') || lastInputType.current.includes('history'))) {
            clearVirtualFocus(true);
            // If onChange was triggered before the timeout actually updated the activedescendant, we need to fire
            // our own dispatchVirtualFocus so focusVisible gets reapplied on the input
            if ((0, $57a86975180d30a8$export$759df0d867455a91)(document) === inputRef.current) (0, $57a86975180d30a8$export$2b35b76d2e30e129)(inputRef.current, null);
        }
        state.setInputValue(value);
    };
    let keyDownTarget = (0, $8FiQn$useRef)(null);
    // For textfield specific keydown operations
    let onKeyDown = (e)=>{
        keyDownTarget.current = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
        if (e.nativeEvent.isComposing) return;
        let focusedNodeId = queuedActiveDescendant.current;
        if (focusedNodeId !== null && (0, $cc3c3666b64debad$export$b204af158042fbac)(inputRef.current).getElementById(focusedNodeId) == null) {
            // if the focused id doesn't exist in document, then we need to clear the tracked focused node, otherwise
            // we will be attempting to fire key events on a non-existing node instead of trying to focus the newly swapped wrapped collection.
            // This can happen if you are swapping out the Autocomplete wrapped collection component like in the docs search.
            queuedActiveDescendant.current = null;
            focusedNodeId = null;
        }
        switch(e.key){
            case 'a':
                if ((0, $2224c9ee07fd529d$export$16792effe837dba3)(e)) return;
                break;
            case 'Escape':
                // Early return for Escape here so it doesn't leak the Escape event from the simulated collection event below and
                // close the dialog prematurely. Ideally that should be up to the discretion of the input element hence the check
                // for isPropagationStopped
                if (e.isDefaultPrevented()) return;
                break;
            case ' ':
                // Space shouldn't trigger onAction so early return.
                return;
            case 'Tab':
                // Don't propogate Tab down to the collection, otherwise we will try to focus the collection via useSelectableCollection's Tab handler (aka shift tab logic)
                // We want FocusScope to handle Tab if one exists (aka sub dialog), so special casepropogate
                if ('continuePropagation' in e) e.continuePropagation();
                return;
            case 'Home':
            case 'End':
            case 'PageDown':
            case 'PageUp':
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowRight':
            case 'ArrowLeft':
                {
                    var _collectionRef_current;
                    if ((e.key === 'Home' || e.key === 'End') && focusedNodeId == null && e.shiftKey) return;
                    // If there is text within the input field, we'll want continue propagating events down
                    // to the wrapped collection if there is a focused node so that a user can continue moving the
                    // virtual focus. However, if the user doesn't have a focus in the collection, just move the text
                    // cursor instead. They can move focus down into the collection via down/up arrow if need be
                    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && state.inputValue.length > 0) {
                        if (focusedNodeId == null) {
                            if (!e.isPropagationStopped()) e.stopPropagation();
                            return;
                        }
                        break;
                    }
                    // Prevent these keys from moving the text cursor in the input
                    e.preventDefault();
                    // Move virtual focus into the wrapped collection
                    let focusCollection = new CustomEvent((0, $7376cba1b89d16ef$export$831c820ad60f9d12), {
                        cancelable: true,
                        bubbles: true
                    });
                    (_collectionRef_current = collectionRef.current) === null || _collectionRef_current === void 0 ? void 0 : _collectionRef_current.dispatchEvent(focusCollection);
                    break;
                }
        }
        // Emulate the keyboard events that happen in the input field in the wrapped collection. This is for triggering things like onAction via Enter
        // or moving focus from one item to another. Stop propagation on the input event if it isn't already stopped so it doesn't leak out. For events
        // like ESC, the dispatched event below will bubble out of the collection and be stopped if handled by useSelectableCollection, otherwise will bubble
        // as expected
        if (!e.isPropagationStopped()) e.stopPropagation();
        let shouldPerformDefaultAction = true;
        if (collectionRef.current !== null) {
            var _collectionRef_current1;
            if (focusedNodeId == null) shouldPerformDefaultAction = ((_collectionRef_current1 = collectionRef.current) === null || _collectionRef_current1 === void 0 ? void 0 : _collectionRef_current1.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent))) || false;
            else {
                let item = document.getElementById(focusedNodeId);
                if (item) shouldPerformDefaultAction = (item === null || item === void 0 ? void 0 : item.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent))) || false;
            }
        }
        if (shouldPerformDefaultAction) switch(e.key){
            case 'ArrowLeft':
            case 'ArrowRight':
                // Clear the activedescendant so NVDA announcements aren't interrupted but retain the focused key in the collection so the
                // user's keyboard navigation restarts from where they left off
                clearVirtualFocus();
                break;
            case 'Enter':
                // Trigger click action on item when Enter key was pressed.
                if (focusedNodeId != null) {
                    let item = document.getElementById(focusedNodeId);
                    item === null || item === void 0 ? void 0 : item.dispatchEvent(new PointerEvent('click', e.nativeEvent));
                }
                break;
        }
        else // TODO: check if we can do this, want to stop textArea from using its default Enter behavior so items are properly triggered
        e.preventDefault();
    };
    let onKeyUpCapture = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        // Dispatch simulated key up events for things like triggering links in listbox
        // Make sure to stop the propagation of the input keyup event so that the simulated keyup/down pair
        // is detected by usePress instead of the original keyup originating from the input
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === keyDownTarget.current) {
            var _collectionRef_current;
            e.stopImmediatePropagation();
            let focusedNodeId = queuedActiveDescendant.current;
            if (focusedNodeId == null) (_collectionRef_current = collectionRef.current) === null || _collectionRef_current === void 0 ? void 0 : _collectionRef_current.dispatchEvent(new KeyboardEvent(e.type, e));
            else {
                let item = document.getElementById(focusedNodeId);
                item === null || item === void 0 ? void 0 : item.dispatchEvent(new KeyboardEvent(e.type, e));
            }
        }
    });
    (0, $8FiQn$useEffect)(()=>{
        document.addEventListener('keyup', onKeyUpCapture, true);
        return ()=>{
            document.removeEventListener('keyup', onKeyUpCapture, true);
        };
    }, []);
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($8FiQn$intlStringsjs))), '@react-aria/autocomplete');
    let collectionProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        id: collectionId,
        'aria-label': stringFormatter.format('collectionLabel')
    });
    let filterFn = (0, $8FiQn$useCallback)((nodeTextValue, node)=>{
        if (filter) return filter(nodeTextValue, state.inputValue, node);
        return true;
    }, [
        state.inputValue,
        filter
    ]);
    // Be sure to clear/restore the virtual + collection focus when blurring/refocusing the field so we only show the
    // focus ring on the virtually focused collection when are actually interacting with the Autocomplete
    let onBlur = (e)=>{
        if (!e.isTrusted) return;
        let lastFocusedNode = queuedActiveDescendant.current ? document.getElementById(queuedActiveDescendant.current) : null;
        if (lastFocusedNode) (0, $57a86975180d30a8$export$6c5dc7e81d2cc29a)(lastFocusedNode, e.relatedTarget);
    };
    let onFocus = (e)=>{
        if (!e.isTrusted) return;
        let curFocusedNode = queuedActiveDescendant.current ? document.getElementById(queuedActiveDescendant.current) : null;
        if (curFocusedNode) {
            let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
            queueMicrotask(()=>{
                // instead of focusing the last focused node, just focus the collection instead and have the collection handle what item to focus via useSelectableCollection/Item
                (0, $57a86975180d30a8$export$6c5dc7e81d2cc29a)(target, collectionRef.current);
                (0, $57a86975180d30a8$export$2b35b76d2e30e129)(collectionRef.current, target);
            });
        }
    };
    // Clicking back into the input can happen after focus moved elsewhere in the dialog, while
    // virtual focus is still on an option. Clear virtual focus on pointer down so mouse
    // interactions restore the input state before the click's focus handling runs.
    // Touch is excluded because touch interactions should not move focus back to the input.
    let onPointerDown = (e)=>{
        if (e.button !== 0 || e.pointerType === 'touch' || queuedActiveDescendant.current == null || inputRef.current == null) return;
        if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === inputRef.current) clearVirtualFocus();
    };
    // Only apply the autocomplete specific behaviors if the collection component wrapped by it is actually
    // being filtered/allows filtering by the Autocomplete.
    let inputProps = {
        value: state.inputValue,
        onChange: onChange
    };
    var _state_focusedNodeId;
    let virtualFocusProps = {
        onKeyDown: onKeyDown,
        'aria-activedescendant': (_state_focusedNodeId = state.focusedNodeId) !== null && _state_focusedNodeId !== void 0 ? _state_focusedNodeId : undefined,
        onBlur: onBlur,
        onFocus: onFocus,
        onPointerDown: onPointerDown
    };
    if (hasCollection) inputProps = {
        ...inputProps,
        ...shouldUseVirtualFocus && virtualFocusProps,
        enterKeyHint: 'go',
        'aria-controls': collectionId,
        // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
        'aria-autocomplete': 'list',
        // This disable's iOS's autocorrect suggestions, since the autocomplete provides its own suggestions.
        autoCorrect: 'off',
        // This disable's the macOS Safari spell check auto corrections.
        spellCheck: 'false',
        autoComplete: 'off'
    };
    return {
        inputProps: inputProps,
        collectionProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(collectionProps, {
            shouldUseVirtualFocus: shouldUseVirtualFocus,
            disallowTypeAhead: shouldUseVirtualFocus
        }),
        collectionRef: mergedCollectionRef,
        filter: filter != null ? filterFn : undefined
    };
}


export {$e9f66e10c06d1e5c$export$1e40b3ca02d92d21 as useAutocomplete};
//# sourceMappingURL=useAutocomplete.js.map
