import {CLEAR_FOCUS_EVENT as $7376cba1b89d16ef$export$447a38995de2c711, FOCUS_EVENT as $7376cba1b89d16ef$export$831c820ad60f9d12} from "../utils/constants.js";
import {dispatchVirtualFocus as $57a86975180d30a8$export$2b35b76d2e30e129, moveVirtualFocus as $57a86975180d30a8$export$76e4e37e5339496d} from "../focus/virtualFocus.js";
import {focusSafely as $56c81cdebdc6a696$export$80f3e147d781571c} from "../interactions/focusSafely.js";
import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, isFocusWithin as $d8ac7ed472840322$export$b4f377a2b6254582, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getFocusableTreeWalker as $903814aeb7d53b38$export$2d6ec8fc375ceafa} from "../focus/FocusScope.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9} from "../interactions/useFocusVisible.js";
import {getItemElement as $8f207f199487227b$export$c3d8340acf92597f, isNonContiguousSelectionModifier as $8f207f199487227b$export$d3e3bd3e26688c04, useCollectionId as $8f207f199487227b$export$881eb0d9f3605d9d} from "./utils.js";
import {isCtrlKeyPressed as $2224c9ee07fd529d$export$16792effe837dba3} from "../utils/keyboard.js";
import {isTabbable as $ee5e22534121197a$export$bebd5a1431fec25d} from "../utils/isFocusable.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {scrollIntoView as $6507765bd7f5ad94$export$53a0910f038337bd, scrollIntoViewport as $6507765bd7f5ad94$export$c826860796309d1b} from "../utils/scrollIntoView.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useRouter as $044d3c97ce5d6621$export$9a302a45f65d0572} from "../utils/openLink.js";
import {useTypeSelect as $d6feb9780eea1a71$export$e32c88dfddc6e1d8} from "./useTypeSelect.js";
import {useUpdateLayoutEffect as $96d0d4862843d873$export$72ef708ab07251f1} from "../utils/useUpdateLayoutEffect.js";
import {flushSync as $ld26Q$flushSync} from "react-dom";
import {useRef as $ld26Q$useRef, useEffect as $ld26Q$useEffect} from "react";

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


















function $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c(options) {
    let { selectionManager: manager, keyboardDelegate: delegate, ref: ref, autoFocus: autoFocus = false, shouldFocusWrap: shouldFocusWrap = false, disallowEmptySelection: disallowEmptySelection = false, disallowSelectAll: disallowSelectAll = false, escapeKeyBehavior: escapeKeyBehavior = 'clearSelection', selectOnFocus: selectOnFocus = manager.selectionBehavior === 'replace', disallowTypeAhead: disallowTypeAhead = false, shouldUseVirtualFocus: shouldUseVirtualFocus, allowsTabNavigation: allowsTabNavigation = false, scrollRef: // If no scrollRef is provided, assume the collection ref is the scrollable region
    scrollRef = ref, linkBehavior: linkBehavior = 'action' } = options;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let router = (0, $044d3c97ce5d6621$export$9a302a45f65d0572)();
    let onKeyDown = (e)=>{
        // Prevent option + tab from doing anything since it doesn't move focus to the cells, only buttons/checkboxes
        if (e.altKey && e.key === 'Tab') e.preventDefault();
        // Keyboard events bubble through portals. Don't handle keyboard events
        // for elements outside the collection (e.g. menus).
        if (!ref.current || !(0, $d8ac7ed472840322$export$4282f70798064fe0)(ref.current, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        const navigateToKey = (key, childFocus)=>{
            if (key != null) {
                if (manager.isLink(key) && linkBehavior === 'selection' && selectOnFocus && !(0, $8f207f199487227b$export$d3e3bd3e26688c04)(e)) {
                    // Set focused key and re-render synchronously to bring item into view if needed.
                    (0, $ld26Q$flushSync)(()=>{
                        manager.setFocusedKey(key, childFocus);
                    });
                    let item = (0, $8f207f199487227b$export$c3d8340acf92597f)(ref, key);
                    let itemProps = manager.getItemProps(key);
                    if (item) router.open(item, e, itemProps.href, itemProps.routerOptions);
                    return;
                }
                manager.setFocusedKey(key, childFocus);
                if (manager.isLink(key) && linkBehavior === 'override') return;
                if (e.shiftKey && manager.selectionMode === 'multiple') manager.extendSelection(key);
                else if (selectOnFocus && !(0, $8f207f199487227b$export$d3e3bd3e26688c04)(e)) manager.replaceSelection(key);
            }
        };
        switch(e.key){
            case 'ArrowDown':
                if (delegate.getKeyBelow) {
                    var _delegate_getKeyBelow, _delegate_getFirstKey, _delegate_getFirstKey1;
                    let nextKey = manager.focusedKey != null ? (_delegate_getKeyBelow = delegate.getKeyBelow) === null || _delegate_getKeyBelow === void 0 ? void 0 : _delegate_getKeyBelow.call(delegate, manager.focusedKey) : (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate);
                    if (nextKey == null && shouldFocusWrap) nextKey = (_delegate_getFirstKey1 = delegate.getFirstKey) === null || _delegate_getFirstKey1 === void 0 ? void 0 : _delegate_getFirstKey1.call(delegate, manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey);
                    }
                }
                break;
            case 'ArrowUp':
                if (delegate.getKeyAbove) {
                    var _delegate_getKeyAbove, _delegate_getLastKey, _delegate_getLastKey1;
                    let nextKey = manager.focusedKey != null ? (_delegate_getKeyAbove = delegate.getKeyAbove) === null || _delegate_getKeyAbove === void 0 ? void 0 : _delegate_getKeyAbove.call(delegate, manager.focusedKey) : (_delegate_getLastKey = delegate.getLastKey) === null || _delegate_getLastKey === void 0 ? void 0 : _delegate_getLastKey.call(delegate);
                    if (nextKey == null && shouldFocusWrap) nextKey = (_delegate_getLastKey1 = delegate.getLastKey) === null || _delegate_getLastKey1 === void 0 ? void 0 : _delegate_getLastKey1.call(delegate, manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey);
                    }
                }
                break;
            case 'ArrowLeft':
                if (delegate.getKeyLeftOf) {
                    var _delegate_getKeyLeftOf, _delegate_getFirstKey2, _delegate_getFirstKey3, _delegate_getLastKey2;
                    let nextKey = manager.focusedKey != null ? (_delegate_getKeyLeftOf = delegate.getKeyLeftOf) === null || _delegate_getKeyLeftOf === void 0 ? void 0 : _delegate_getKeyLeftOf.call(delegate, manager.focusedKey) : (_delegate_getFirstKey2 = delegate.getFirstKey) === null || _delegate_getFirstKey2 === void 0 ? void 0 : _delegate_getFirstKey2.call(delegate);
                    if (nextKey == null && shouldFocusWrap) nextKey = direction === 'rtl' ? (_delegate_getFirstKey3 = delegate.getFirstKey) === null || _delegate_getFirstKey3 === void 0 ? void 0 : _delegate_getFirstKey3.call(delegate, manager.focusedKey) : (_delegate_getLastKey2 = delegate.getLastKey) === null || _delegate_getLastKey2 === void 0 ? void 0 : _delegate_getLastKey2.call(delegate, manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey, direction === 'rtl' ? 'first' : 'last');
                    }
                }
                break;
            case 'ArrowRight':
                if (delegate.getKeyRightOf) {
                    var _delegate_getKeyRightOf, _delegate_getFirstKey4, _delegate_getLastKey3, _delegate_getFirstKey5;
                    let nextKey = manager.focusedKey != null ? (_delegate_getKeyRightOf = delegate.getKeyRightOf) === null || _delegate_getKeyRightOf === void 0 ? void 0 : _delegate_getKeyRightOf.call(delegate, manager.focusedKey) : (_delegate_getFirstKey4 = delegate.getFirstKey) === null || _delegate_getFirstKey4 === void 0 ? void 0 : _delegate_getFirstKey4.call(delegate);
                    if (nextKey == null && shouldFocusWrap) nextKey = direction === 'rtl' ? (_delegate_getLastKey3 = delegate.getLastKey) === null || _delegate_getLastKey3 === void 0 ? void 0 : _delegate_getLastKey3.call(delegate, manager.focusedKey) : (_delegate_getFirstKey5 = delegate.getFirstKey) === null || _delegate_getFirstKey5 === void 0 ? void 0 : _delegate_getFirstKey5.call(delegate, manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey, direction === 'rtl' ? 'last' : 'first');
                    }
                }
                break;
            case 'Home':
                if (delegate.getFirstKey) {
                    if (manager.focusedKey === null && e.shiftKey) return;
                    e.preventDefault();
                    let firstKey = delegate.getFirstKey(manager.focusedKey, (0, $2224c9ee07fd529d$export$16792effe837dba3)(e));
                    manager.setFocusedKey(firstKey);
                    if (firstKey != null) {
                        if ((0, $2224c9ee07fd529d$export$16792effe837dba3)(e) && e.shiftKey && manager.selectionMode === 'multiple') manager.extendSelection(firstKey);
                        else if (selectOnFocus) manager.replaceSelection(firstKey);
                    }
                }
                break;
            case 'End':
                if (delegate.getLastKey) {
                    if (manager.focusedKey === null && e.shiftKey) return;
                    e.preventDefault();
                    let lastKey = delegate.getLastKey(manager.focusedKey, (0, $2224c9ee07fd529d$export$16792effe837dba3)(e));
                    manager.setFocusedKey(lastKey);
                    if (lastKey != null) {
                        if ((0, $2224c9ee07fd529d$export$16792effe837dba3)(e) && e.shiftKey && manager.selectionMode === 'multiple') manager.extendSelection(lastKey);
                        else if (selectOnFocus) manager.replaceSelection(lastKey);
                    }
                }
                break;
            case 'PageDown':
                if (delegate.getKeyPageBelow && manager.focusedKey != null) {
                    let nextKey = delegate.getKeyPageBelow(manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey);
                    }
                }
                break;
            case 'PageUp':
                if (delegate.getKeyPageAbove && manager.focusedKey != null) {
                    let nextKey = delegate.getKeyPageAbove(manager.focusedKey);
                    if (nextKey != null) {
                        e.preventDefault();
                        navigateToKey(nextKey);
                    }
                }
                break;
            case 'a':
                if ((0, $2224c9ee07fd529d$export$16792effe837dba3)(e) && manager.selectionMode === 'multiple' && disallowSelectAll !== true) {
                    e.preventDefault();
                    manager.selectAll();
                }
                break;
            case 'Escape':
                if (escapeKeyBehavior === 'clearSelection' && !disallowEmptySelection && manager.selectedKeys.size !== 0) {
                    e.stopPropagation();
                    e.preventDefault();
                    manager.clearSelection();
                }
                break;
            case 'Tab':
                if (!allowsTabNavigation) {
                    // There may be elements that are "tabbable" inside a collection (e.g. in a grid cell).
                    // However, collections should be treated as a single tab stop, with arrow key navigation internally.
                    // We don't control the rendering of these, so we can't override the tabIndex to prevent tabbing.
                    // Instead, we handle the Tab key, and move focus manually to the first/last tabbable element
                    // in the collection, so that the browser default behavior will apply starting from that element
                    // rather than the currently focused one.
                    if (e.shiftKey) ref.current.focus();
                    else {
                        let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(ref.current, {
                            tabbable: true
                        });
                        let next = undefined;
                        let last;
                        do {
                            last = walker.lastChild();
                            // oxlint-disable-next-line max-depth
                            if (last) next = last;
                        }while (last);
                        // If the active element is NOT tabbable but is contained by an element that IS tabbable (aka the cell), the browser will actually move focus to
                        // the containing element. We need to special case this so that tab will move focus out of the grid instead of looping between
                        // focusing the containing cell and back to the non-tabbable child element
                        let activeElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)();
                        if (next && (!(0, $d8ac7ed472840322$export$b4f377a2b6254582)(next) || activeElement && !(0, $ee5e22534121197a$export$bebd5a1431fec25d)(activeElement))) (0, $d559d872031c749f$export$de79e2c695e052f3)(next);
                    }
                    break;
                }
        }
    };
    // Store the scroll position so we can restore it later.
    /// TODO: should this happen all the time??
    let scrollPos = (0, $ld26Q$useRef)({
        top: 0,
        left: 0
    });
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(scrollRef, 'scroll', ()=>{
        var _scrollRef_current, _scrollRef_current1;
        var _scrollRef_current_scrollTop, _scrollRef_current_scrollLeft;
        scrollPos.current = {
            top: (_scrollRef_current_scrollTop = (_scrollRef_current = scrollRef.current) === null || _scrollRef_current === void 0 ? void 0 : _scrollRef_current.scrollTop) !== null && _scrollRef_current_scrollTop !== void 0 ? _scrollRef_current_scrollTop : 0,
            left: (_scrollRef_current_scrollLeft = (_scrollRef_current1 = scrollRef.current) === null || _scrollRef_current1 === void 0 ? void 0 : _scrollRef_current1.scrollLeft) !== null && _scrollRef_current_scrollLeft !== void 0 ? _scrollRef_current_scrollLeft : 0
        };
    });
    let onFocus = (e)=>{
        if (manager.isFocused) {
            // If a focus event bubbled through a portal, reset focus state.
            if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) manager.setFocused(false);
            return;
        }
        // Focus events can bubble through portals. Ignore these events.
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) return;
        manager.setFocused(true);
        if (manager.focusedKey == null) {
            var _delegate_getLastKey, _delegate_getFirstKey;
            let navigateToKey = (key)=>{
                if (key != null) {
                    manager.setFocusedKey(key);
                    if (selectOnFocus && !manager.isSelected(key)) manager.replaceSelection(key);
                }
            };
            // If the user hasn't yet interacted with the collection, there will be no focusedKey set.
            // Attempt to detect whether the user is tabbing forward or backward into the collection
            // and either focus the first or last item accordingly.
            let relatedTarget = e.relatedTarget;
            var _manager_lastSelectedKey, _manager_firstSelectedKey;
            if (relatedTarget && e.currentTarget.compareDocumentPosition(relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING) navigateToKey((_manager_lastSelectedKey = manager.lastSelectedKey) !== null && _manager_lastSelectedKey !== void 0 ? _manager_lastSelectedKey : (_delegate_getLastKey = delegate.getLastKey) === null || _delegate_getLastKey === void 0 ? void 0 : _delegate_getLastKey.call(delegate));
            else navigateToKey((_manager_firstSelectedKey = manager.firstSelectedKey) !== null && _manager_firstSelectedKey !== void 0 ? _manager_firstSelectedKey : (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate));
        } else if (scrollRef.current) {
            // Restore the scroll position to what it was before.
            scrollRef.current.scrollTop = scrollPos.current.top;
            scrollRef.current.scrollLeft = scrollPos.current.left;
        }
        if (manager.focusedKey != null && scrollRef.current) {
            // Refocus and scroll the focused item into view if it exists within the scrollable region.
            let element = (0, $8f207f199487227b$export$c3d8340acf92597f)(ref, manager.focusedKey);
            if (element instanceof HTMLElement) {
                // This prevents a flash of focus on the first/last element in the collection, or the collection itself.
                if (!(0, $d8ac7ed472840322$export$b4f377a2b6254582)(element) && !shouldUseVirtualFocus) (0, $d559d872031c749f$export$de79e2c695e052f3)(element);
                let modality = (0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)();
                if (modality === 'keyboard') (0, $6507765bd7f5ad94$export$c826860796309d1b)(element, {
                    containingElement: ref.current
                });
            }
        }
    };
    let onBlur = (e)=>{
        // Don't set blurred and then focused again if moving focus within the collection.
        if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget)) manager.setFocused(false);
    };
    // Ref to track whether the first item in the collection should be automatically focused. Specifically used for autocomplete when user types
    // to focus the first key AFTER the collection updates.
    // TODO: potentially expand the usage of this
    let shouldVirtualFocusFirst = (0, $ld26Q$useRef)(false);
    // Add event listeners for custom virtual events. These handle updating the focused key in response to various keyboard events
    // at the autocomplete level
    // TODO: fix type later
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, (0, $7376cba1b89d16ef$export$831c820ad60f9d12), !shouldUseVirtualFocus ? undefined : (e)=>{
        let { detail: detail } = e;
        e.stopPropagation();
        manager.setFocused(true);
        // If the user is typing forwards, autofocus the first option in the list.
        if ((detail === null || detail === void 0 ? void 0 : detail.focusStrategy) === 'first') shouldVirtualFocusFirst.current = true;
    });
    // update active descendant
    (0, $96d0d4862843d873$export$72ef708ab07251f1)(()=>{
        if (shouldVirtualFocusFirst.current) {
            var _delegate_getFirstKey;
            var _delegate_getFirstKey1;
            let keyToFocus = (_delegate_getFirstKey1 = (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate)) !== null && _delegate_getFirstKey1 !== void 0 ? _delegate_getFirstKey1 : null;
            // If no focusable items exist in the list, make sure to clear any activedescendant that may still exist and move focus back to
            // the original active element (e.g. the autocomplete input)
            if (keyToFocus == null) {
                let previousActiveElement = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)();
                (0, $57a86975180d30a8$export$76e4e37e5339496d)(ref.current);
                (0, $57a86975180d30a8$export$2b35b76d2e30e129)(previousActiveElement, null);
                // If there wasn't a focusable key but the collection had items, then that means we aren't in an intermediate load state and all keys are disabled.
                // Reset shouldVirtualFocusFirst so that we don't erronously autofocus an item when the collection is filtered again.
                if (manager.collection.size > 0) shouldVirtualFocusFirst.current = false;
            } else {
                manager.setFocusedKey(keyToFocus);
                // Only set shouldVirtualFocusFirst to false if we've successfully set the first key as the focused key
                // If there wasn't a key to focus, we might be in a temporary loading state so we'll want to still focus the first key
                // after the collection updates after load
                shouldVirtualFocusFirst.current = false;
            }
        }
    }, [
        manager.collection
    ]);
    // reset focus first flag
    (0, $96d0d4862843d873$export$72ef708ab07251f1)(()=>{
        // If user causes the focused key to change in any other way, clear shouldVirtualFocusFirst so we don't
        // accidentally move focus from under them. Skip this if the collection was empty because we might be in a load
        // state and will still want to focus the first item after load
        if (manager.collection.size > 0) shouldVirtualFocusFirst.current = false;
    }, [
        manager.focusedKey
    ]);
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, (0, $7376cba1b89d16ef$export$447a38995de2c711), !shouldUseVirtualFocus ? undefined : (e)=>{
        var _e_detail;
        e.stopPropagation();
        manager.setFocused(false);
        if ((_e_detail = e.detail) === null || _e_detail === void 0 ? void 0 : _e_detail.clearFocusKey) manager.setFocusedKey(null);
    });
    const autoFocusRef = (0, $ld26Q$useRef)(autoFocus);
    const didAutoFocusRef = (0, $ld26Q$useRef)(false);
    (0, $ld26Q$useEffect)(()=>{
        if (autoFocusRef.current) {
            var _delegate_getFirstKey, _delegate_getLastKey;
            let focusedKey = null;
            var _delegate_getFirstKey1;
            // Check focus strategy to determine which item to focus
            if (autoFocus === 'first') focusedKey = (_delegate_getFirstKey1 = (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate)) !== null && _delegate_getFirstKey1 !== void 0 ? _delegate_getFirstKey1 : null;
            var _delegate_getLastKey1;
            if (autoFocus === 'last') focusedKey = (_delegate_getLastKey1 = (_delegate_getLastKey = delegate.getLastKey) === null || _delegate_getLastKey === void 0 ? void 0 : _delegate_getLastKey.call(delegate)) !== null && _delegate_getLastKey1 !== void 0 ? _delegate_getLastKey1 : null;
            // If there are any selected keys, make the first one the new focus target
            let selectedKeys = manager.selectedKeys;
            if (selectedKeys.size) {
                for (let key of selectedKeys)if (manager.canSelectItem(key)) {
                    focusedKey = key;
                    break;
                }
            }
            manager.setFocused(true);
            manager.setFocusedKey(focusedKey);
            // If no default focus key is selected, focus the collection itself.
            if (focusedKey == null && !shouldUseVirtualFocus && ref.current) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
            // Wait until the collection has items to autofocus.
            if (manager.collection.size > 0) {
                autoFocusRef.current = false;
                didAutoFocusRef.current = true;
            }
        }
    });
    // Scroll the focused element into view when the focusedKey changes.
    let lastFocusedKey = (0, $ld26Q$useRef)(manager.focusedKey);
    let raf = (0, $ld26Q$useRef)(null);
    (0, $ld26Q$useEffect)(()=>{
        if (manager.isFocused && manager.focusedKey != null && (manager.focusedKey !== lastFocusedKey.current || didAutoFocusRef.current) && scrollRef.current && ref.current) {
            let modality = (0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)();
            let element = (0, $8f207f199487227b$export$c3d8340acf92597f)(ref, manager.focusedKey);
            if (!(element instanceof HTMLElement)) // If item element wasn't found, return early (don't update autoFocusRef and lastFocusedKey).
            // The collection may initially be empty (e.g. virtualizer), so wait until the element exists.
            return;
            if (modality === 'keyboard' || didAutoFocusRef.current) {
                if (raf.current) cancelAnimationFrame(raf.current);
                raf.current = requestAnimationFrame(()=>{
                    if (scrollRef.current) {
                        (0, $6507765bd7f5ad94$export$53a0910f038337bd)(scrollRef.current, element);
                        // Avoid scroll in iOS VO, since it may cause overlay to close (i.e. RAC submenu)
                        if (modality !== 'virtual') (0, $6507765bd7f5ad94$export$c826860796309d1b)(element, {
                            containingElement: ref.current
                        });
                    }
                });
            }
        }
        // If the focused key becomes null (e.g. the last item is deleted), focus the whole collection.
        if (!shouldUseVirtualFocus && manager.isFocused && manager.focusedKey == null && lastFocusedKey.current != null && ref.current) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
        lastFocusedKey.current = manager.focusedKey;
        didAutoFocusRef.current = false;
    });
    (0, $ld26Q$useEffect)(()=>{
        return ()=>{
            if (raf.current) cancelAnimationFrame(raf.current);
        };
    }, []);
    // Intercept FocusScope restoration since virtualized collections can reuse DOM nodes.
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, 'react-aria-focus-scope-restore', (e)=>{
        e.preventDefault();
        manager.setFocused(true);
    });
    let handlers = {
        onKeyDown: onKeyDown,
        onFocus: onFocus,
        onBlur: onBlur,
        onMouseDown (e) {
            // Ignore events that bubbled through portals.
            if (scrollRef.current === (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) // Prevent focus going to the collection when clicking on the scrollbar.
            e.preventDefault();
        }
    };
    let { typeSelectProps: typeSelectProps } = (0, $d6feb9780eea1a71$export$e32c88dfddc6e1d8)({
        keyboardDelegate: delegate,
        selectionManager: manager
    });
    if (!disallowTypeAhead) handlers = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(typeSelectProps, handlers);
    // If nothing is focused within the collection, make the collection itself tabbable.
    // This will be marshalled to either the first or last item depending on where focus came from.
    let tabIndex = undefined;
    if (!shouldUseVirtualFocus) tabIndex = manager.focusedKey == null ? 0 : -1;
    let collectionId = (0, $8f207f199487227b$export$881eb0d9f3605d9d)(manager.collection);
    return {
        collectionProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(handlers, {
            tabIndex: tabIndex,
            'data-collection': collectionId
        })
    };
}


export {$80c8b4b5cf8e1f86$export$d6daf82dcd84e87c as useSelectableCollection};
//# sourceMappingURL=useSelectableCollection.js.map
