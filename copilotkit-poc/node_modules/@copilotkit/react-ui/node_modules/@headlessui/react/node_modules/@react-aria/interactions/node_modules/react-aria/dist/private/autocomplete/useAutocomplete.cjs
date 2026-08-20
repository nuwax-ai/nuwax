var $79558b1ff24cb93a$exports = require("../utils/constants.cjs");
var $4f541c01c875ab4e$exports = require("../focus/virtualFocus.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $319d1083d8ce6661$exports = require("./intlStrings.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $d74c59468d7890a7$exports = require("../utils/keyboard.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $8b3af019b8cf786c$exports = require("../utils/mergeRefs.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $d3019c77b88650e9$exports = require("../utils/useObjectRef.cjs");
var $7JMdJ$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useAutocomplete", function () { return $520542e1cf209aea$export$1e40b3ca02d92d21; });
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

















function $520542e1cf209aea$export$1e40b3ca02d92d21(props, state) {
    let { inputRef: inputRef, collectionRef: collectionRef, filter: filter, disableAutoFocusFirst: disableAutoFocusFirst = false, disableVirtualFocus: disableVirtualFocus = false } = props;
    let collectionId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let timeout = (0, $7JMdJ$react.useRef)(undefined);
    let delayNextActiveDescendant = (0, $7JMdJ$react.useRef)(false);
    let queuedActiveDescendant = (0, $7JMdJ$react.useRef)(null);
    // For mobile screen readers, we don't want virtual focus, instead opting to disable FocusScope's restoreFocus and manually
    // moving focus back to the subtriggers
    let isMobileScreenReader = (0, $d0df89f3abe2c2ca$exports.getInteractionModality)() === 'virtual' && ((0, $d0b4a781cf26e80b$exports.isIOS)() || (0, $d0b4a781cf26e80b$exports.isAndroid)());
    let [shouldUseVirtualFocus, setShouldUseVirtualFocus] = (0, $7JMdJ$react.useState)(!isMobileScreenReader && !disableVirtualFocus);
    // Tracks if a collection has been connected to the autocomplete. If false, we don't want to add various attributes to the autocomplete input
    // since it isn't attached to a filterable collection (e.g. Tabs)
    let [hasCollection, setHasCollection] = (0, $7JMdJ$react.useState)(false);
    (0, $7JMdJ$react.useEffect)(()=>{
        return ()=>clearTimeout(timeout.current);
    }, []);
    let updateActiveDescendantEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        // Ensure input is focused if the user clicks on the collection directly.
        // don't trigger on touch so that mobile keyboard doesnt appear when tapping on options
        if (!e.isTrusted && shouldUseVirtualFocus && inputRef.current && (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(inputRef.current)) !== inputRef.current && (0, $d0df89f3abe2c2ca$exports.getPointerType)() !== 'touch') inputRef.current.focus();
        let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
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
    let [collectionNode, setCollectionNode] = (0, $7JMdJ$react.useState)(null);
    let callbackRef = (0, $7JMdJ$react.useCallback)((node)=>{
        setCollectionNode(node);
        if (node != null) {
            // If useSelectableCollection isn't passed shouldUseVirtualFocus even when useAutocomplete provides it
            // that means the collection doesn't support it (e.g. Table). If that is the case, we need to disable it here regardless
            // of what the user's provided so that the input doesn't recieve the onKeyDown and autocomplete props.
            if (node.getAttribute('tabindex') != null) setShouldUseVirtualFocus(false);
            setHasCollection(true);
        } else setHasCollection(false);
    }, []);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        if (collectionNode != null) // When typing forward, we want to delay the setting of active descendant to not interrupt the native screen reader announcement
        // of the letter you just typed. If we recieve another focus event then we clear the queued update
        collectionNode.addEventListener('focusin', updateActiveDescendantEvent);
        return ()=>{
            collectionNode?.removeEventListener('focusin', updateActiveDescendantEvent);
        };
    }, [
        collectionNode
    ]);
    // Make sure to memo so that React doesn't keep registering a new event listeners on every rerender of the wrapped collection
    let mergedCollectionRef = (0, $d3019c77b88650e9$exports.useObjectRef)((0, $7JMdJ$react.useMemo)(()=>(0, $8b3af019b8cf786c$exports.mergeRefs)(collectionRef, callbackRef), [
        collectionRef,
        callbackRef
    ]));
    let focusFirstItem = (0, $7JMdJ$react.useCallback)(()=>{
        delayNextActiveDescendant.current = true;
        collectionRef.current?.dispatchEvent(new CustomEvent((0, $79558b1ff24cb93a$exports.FOCUS_EVENT), {
            cancelable: true,
            bubbles: true,
            detail: {
                focusStrategy: 'first'
            }
        }));
    }, [
        collectionRef
    ]);
    let clearVirtualFocus = (0, $7JMdJ$react.useCallback)((clearFocusKey)=>{
        (0, $4f541c01c875ab4e$exports.moveVirtualFocus)((0, $da02ee888921bc9e$exports.getActiveElement)());
        queuedActiveDescendant.current = null;
        state.setFocusedNodeId(null);
        let clearFocusEvent = new CustomEvent((0, $79558b1ff24cb93a$exports.CLEAR_FOCUS_EVENT), {
            cancelable: true,
            bubbles: true,
            detail: {
                clearFocusKey: clearFocusKey
            }
        });
        clearTimeout(timeout.current);
        delayNextActiveDescendant.current = false;
        collectionRef.current?.dispatchEvent(clearFocusEvent);
    }, [
        collectionRef,
        state
    ]);
    let lastInputType = (0, $7JMdJ$react.useRef)('');
    (0, $6e76e65001bbcda2$exports.useEvent)(inputRef, 'input', (e)=>{
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
            if ((0, $4f541c01c875ab4e$exports.getVirtuallyFocusedElement)(document) === inputRef.current) (0, $4f541c01c875ab4e$exports.dispatchVirtualFocus)(inputRef.current, null);
        }
        state.setInputValue(value);
    };
    let keyDownTarget = (0, $7JMdJ$react.useRef)(null);
    // For textfield specific keydown operations
    let onKeyDown = (e)=>{
        keyDownTarget.current = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
        if (e.nativeEvent.isComposing) return;
        let focusedNodeId = queuedActiveDescendant.current;
        if (focusedNodeId !== null && (0, $49582955cc364b1c$exports.getOwnerDocument)(inputRef.current).getElementById(focusedNodeId) == null) {
            // if the focused id doesn't exist in document, then we need to clear the tracked focused node, otherwise
            // we will be attempting to fire key events on a non-existing node instead of trying to focus the newly swapped wrapped collection.
            // This can happen if you are swapping out the Autocomplete wrapped collection component like in the docs search.
            queuedActiveDescendant.current = null;
            focusedNodeId = null;
        }
        switch(e.key){
            case 'a':
                if ((0, $d74c59468d7890a7$exports.isCtrlKeyPressed)(e)) return;
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
                    let focusCollection = new CustomEvent((0, $79558b1ff24cb93a$exports.FOCUS_EVENT), {
                        cancelable: true,
                        bubbles: true
                    });
                    collectionRef.current?.dispatchEvent(focusCollection);
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
            if (focusedNodeId == null) shouldPerformDefaultAction = collectionRef.current?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent)) || false;
            else {
                let item = document.getElementById(focusedNodeId);
                if (item) shouldPerformDefaultAction = item?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent)) || false;
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
                    item?.dispatchEvent(new PointerEvent('click', e.nativeEvent));
                }
                break;
        }
        else // TODO: check if we can do this, want to stop textArea from using its default Enter behavior so items are properly triggered
        e.preventDefault();
    };
    let onKeyUpCapture = (0, $d6e22460ce4d6b26$exports.useEffectEvent)((e)=>{
        // Dispatch simulated key up events for things like triggering links in listbox
        // Make sure to stop the propagation of the input keyup event so that the simulated keyup/down pair
        // is detected by usePress instead of the original keyup originating from the input
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === keyDownTarget.current) {
            e.stopImmediatePropagation();
            let focusedNodeId = queuedActiveDescendant.current;
            if (focusedNodeId == null) collectionRef.current?.dispatchEvent(new KeyboardEvent(e.type, e));
            else {
                let item = document.getElementById(focusedNodeId);
                item?.dispatchEvent(new KeyboardEvent(e.type, e));
            }
        }
    });
    (0, $7JMdJ$react.useEffect)(()=>{
        document.addEventListener('keyup', onKeyUpCapture, true);
        return ()=>{
            document.removeEventListener('keyup', onKeyUpCapture, true);
        };
    }, []);
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($319d1083d8ce6661$exports))), '@react-aria/autocomplete');
    let collectionProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        id: collectionId,
        'aria-label': stringFormatter.format('collectionLabel')
    });
    let filterFn = (0, $7JMdJ$react.useCallback)((nodeTextValue, node)=>{
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
        if (lastFocusedNode) (0, $4f541c01c875ab4e$exports.dispatchVirtualBlur)(lastFocusedNode, e.relatedTarget);
    };
    let onFocus = (e)=>{
        if (!e.isTrusted) return;
        let curFocusedNode = queuedActiveDescendant.current ? document.getElementById(queuedActiveDescendant.current) : null;
        if (curFocusedNode) {
            let target = (0, $da02ee888921bc9e$exports.getEventTarget)(e);
            queueMicrotask(()=>{
                // instead of focusing the last focused node, just focus the collection instead and have the collection handle what item to focus via useSelectableCollection/Item
                (0, $4f541c01c875ab4e$exports.dispatchVirtualBlur)(target, collectionRef.current);
                (0, $4f541c01c875ab4e$exports.dispatchVirtualFocus)(collectionRef.current, target);
            });
        }
    };
    // Clicking back into the input can happen after focus moved elsewhere in the dialog, while
    // virtual focus is still on an option. Clear virtual focus on pointer down so mouse
    // interactions restore the input state before the click's focus handling runs.
    // Touch is excluded because touch interactions should not move focus back to the input.
    let onPointerDown = (e)=>{
        if (e.button !== 0 || e.pointerType === 'touch' || queuedActiveDescendant.current == null || inputRef.current == null) return;
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) === inputRef.current) clearVirtualFocus();
    };
    // Only apply the autocomplete specific behaviors if the collection component wrapped by it is actually
    // being filtered/allows filtering by the Autocomplete.
    let inputProps = {
        value: state.inputValue,
        onChange: onChange
    };
    let virtualFocusProps = {
        onKeyDown: onKeyDown,
        'aria-activedescendant': state.focusedNodeId ?? undefined,
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
        collectionProps: (0, $89b39774f3b79dbb$exports.mergeProps)(collectionProps, {
            shouldUseVirtualFocus: shouldUseVirtualFocus,
            disallowTypeAhead: shouldUseVirtualFocus
        }),
        collectionRef: mergedCollectionRef,
        filter: filter != null ? filterFn : undefined
    };
}


//# sourceMappingURL=useAutocomplete.cjs.map
