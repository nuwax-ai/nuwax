import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {focusSafely as $56c81cdebdc6a696$export$80f3e147d781571c} from "../interactions/focusSafely.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getCollectionId as $8f207f199487227b$export$6aeb1680a0ae8741, isNonContiguousSelectionModifier as $8f207f199487227b$export$d3e3bd3e26688c04} from "./utils.js";
import {isCtrlKeyPressed as $2224c9ee07fd529d$export$16792effe837dba3} from "../utils/keyboard.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {moveVirtualFocus as $57a86975180d30a8$export$76e4e37e5339496d} from "../focus/virtualFocus.js";
import {openLink as $044d3c97ce5d6621$export$95185d699e05d4d7, useRouter as $044d3c97ce5d6621$export$9a302a45f65d0572} from "../utils/openLink.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLongPress as $4a63d38d4cd3f004$export$c24ed0104d07eab9} from "../interactions/useLongPress.js";
import {useEffect as $lEwuS$useEffect, useRef as $lEwuS$useRef} from "react";

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











function $0d8cf6a15fe85601$export$ecf600387e221c37(options) {
    let { id: id, selectionManager: manager, key: key, ref: ref, shouldSelectOnPressUp: shouldSelectOnPressUp, shouldUseVirtualFocus: shouldUseVirtualFocus, focus: focus, isDisabled: isDisabled, onAction: onAction, allowsDifferentPressOrigin: allowsDifferentPressOrigin, linkBehavior: linkBehavior = 'action' } = options;
    let router = (0, $044d3c97ce5d6621$export$9a302a45f65d0572)();
    id = (0, $0292efe68908de6b$export$f680877a34711e37)(id);
    let onSelect = (e)=>{
        if (e.pointerType === 'keyboard' && (0, $8f207f199487227b$export$d3e3bd3e26688c04)(e)) manager.toggleSelection(key);
        else {
            if (manager.selectionMode === 'none') return;
            if (manager.isLink(key)) {
                if (linkBehavior === 'selection' && ref.current) {
                    let itemProps = manager.getItemProps(key);
                    router.open(ref.current, e, itemProps.href, itemProps.routerOptions);
                    // Always set selected keys back to what they were so that select and combobox close.
                    manager.setSelectedKeys(manager.selectedKeys);
                    return;
                } else if (linkBehavior === 'override' || linkBehavior === 'none') return;
            }
            if (manager.selectionMode === 'single') {
                if (manager.isSelected(key) && !manager.disallowEmptySelection) manager.toggleSelection(key);
                else manager.replaceSelection(key);
            } else if (e && e.shiftKey) manager.extendSelection(key);
            else if (manager.selectionBehavior === 'toggle' || e && ((0, $2224c9ee07fd529d$export$16792effe837dba3)(e) || e.pointerType === 'touch' || e.pointerType === 'virtual')) // if touch or virtual (VO) then we just want to toggle, otherwise it's impossible to multi select because they don't have modifier keys
            manager.toggleSelection(key);
            else manager.replaceSelection(key);
        }
    };
    // Focus the associated DOM node when this item becomes the focusedKey
    // TODO: can't make this useLayoutEffect bacause it breaks menus inside dialogs
    // However, if this is a useEffect, it runs twice and dispatches two blur events and immediately sets
    // aria-activeDescendant in useAutocomplete... I've worked around this for now
    (0, $lEwuS$useEffect)(()=>{
        let isFocused = key === manager.focusedKey;
        if (isFocused && manager.isFocused) {
            if (!shouldUseVirtualFocus) {
                if (focus) focus();
                else if ((0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() !== ref.current && ref.current) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
            } else (0, $57a86975180d30a8$export$76e4e37e5339496d)(ref.current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        ref,
        key,
        manager.focusedKey,
        manager.childFocusStrategy,
        manager.isFocused,
        shouldUseVirtualFocus
    ]);
    isDisabled = isDisabled || manager.isDisabled(key);
    // Set tabIndex to 0 if the element is focused, or -1 otherwise so that only the last focused
    // item is tabbable.  If using virtual focus, don't set a tabIndex at all so that VoiceOver
    // on iOS 14 doesn't try to move real DOM focus to the item anyway.
    let itemProps = {};
    if (!shouldUseVirtualFocus && !isDisabled) itemProps = {
        tabIndex: key === manager.focusedKey ? 0 : -1,
        onFocus (e) {
            if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) === ref.current) manager.setFocusedKey(key);
        }
    };
    else if (isDisabled) itemProps.onMouseDown = (e)=>{
        // Prevent focus going to the body when clicking on a disabled item.
        e.preventDefault();
    };
    (0, $lEwuS$useEffect)(()=>{
        if (isDisabled && manager.focusedKey === key) manager.setFocusedKey(null);
    }, [
        manager,
        isDisabled,
        key
    ]);
    // With checkbox selection, onAction (i.e. navigation) becomes primary, and occurs on a single click of the row.
    // Clicking the checkbox enters selection mode, after which clicking anywhere on any row toggles selection for that row.
    // With highlight selection, onAction is secondary, and occurs on double click. Single click selects the row.
    // With touch, onAction occurs on single tap, and long press enters selection mode.
    let isLinkOverride = manager.isLink(key) && linkBehavior === 'override';
    let isActionOverride = onAction && options['UNSTABLE_itemBehavior'] === 'action';
    let hasLinkAction = manager.isLink(key) && linkBehavior !== 'selection' && linkBehavior !== 'none';
    let allowsSelection = !isDisabled && manager.canSelectItem(key) && !isLinkOverride && !isActionOverride;
    let allowsActions = (onAction || hasLinkAction) && !isDisabled;
    let hasPrimaryAction = allowsActions && (manager.selectionBehavior === 'replace' ? !allowsSelection : !allowsSelection || manager.isEmpty);
    let hasSecondaryAction = allowsActions && allowsSelection && manager.selectionBehavior === 'replace';
    let hasAction = hasPrimaryAction || hasSecondaryAction;
    let modality = (0, $lEwuS$useRef)(null);
    let longPressEnabled = hasAction && allowsSelection;
    let longPressEnabledOnPressStart = (0, $lEwuS$useRef)(false);
    let hadPrimaryActionOnPressStart = (0, $lEwuS$useRef)(false);
    let collectionItemProps = manager.getItemProps(key);
    let performAction = (e)=>{
        if (onAction) {
            var _ref_current;
            onAction();
            (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.dispatchEvent(new CustomEvent('react-aria-item-action', {
                bubbles: true
            }));
        }
        if (hasLinkAction && ref.current) router.open(ref.current, e, collectionItemProps.href, collectionItemProps.routerOptions);
    };
    // By default, selection occurs on pointer down. This can be strange if selecting an
    // item causes the UI to disappear immediately (e.g. menus).
    // If shouldSelectOnPressUp is true, we use onPressUp instead of onPressStart.
    // onPress requires a pointer down event on the same element as pointer up. For menus,
    // we want to be able to have the pointer down on the trigger that opens the menu and
    // the pointer up on the menu item rather than requiring a separate press.
    // For keyboard events, selection still occurs on key down.
    let itemPressProps = {
        ref: ref
    };
    if (shouldSelectOnPressUp) {
        itemPressProps.onPressStart = (e)=>{
            modality.current = e.pointerType;
            longPressEnabledOnPressStart.current = longPressEnabled;
            if (e.pointerType === 'keyboard' && (!hasAction || $0d8cf6a15fe85601$var$isSelectionKey(e.key))) onSelect(e);
        };
        // If allowsDifferentPressOrigin and interacting with mouse, make selection happen on pressUp (e.g. open menu on press down, selection on menu item happens on press up.)
        // Otherwise, have selection happen onPress (prevents listview row selection when clicking on interactable elements in the row)
        if (!allowsDifferentPressOrigin) itemPressProps.onPress = (e)=>{
            if (hasPrimaryAction || hasSecondaryAction && e.pointerType !== 'mouse') {
                if (e.pointerType === 'keyboard' && !$0d8cf6a15fe85601$var$isActionKey(e.key)) return;
                performAction(e);
            } else if (e.pointerType !== 'keyboard' && allowsSelection) onSelect(e);
        };
        else {
            itemPressProps.onPressUp = hasPrimaryAction ? undefined : (e)=>{
                if (e.pointerType === 'mouse' && allowsSelection) onSelect(e);
            };
            itemPressProps.onPress = hasPrimaryAction ? performAction : (e)=>{
                if (e.pointerType !== 'keyboard' && e.pointerType !== 'mouse' && allowsSelection) onSelect(e);
            };
        }
    } else {
        itemPressProps.onPressStart = (e)=>{
            modality.current = e.pointerType;
            longPressEnabledOnPressStart.current = longPressEnabled;
            hadPrimaryActionOnPressStart.current = hasPrimaryAction;
            // Select on mouse down unless there is a primary action which will occur on mouse up.
            // For keyboard, select on key down. If there is an action, the Space key selects on key down,
            // and the Enter key performs onAction on key up.
            if (allowsSelection && (e.pointerType === 'mouse' && !hasPrimaryAction || e.pointerType === 'keyboard' && (!allowsActions || $0d8cf6a15fe85601$var$isSelectionKey(e.key)))) onSelect(e);
        };
        itemPressProps.onPress = (e)=>{
            // Selection occurs on touch up. Primary actions always occur on pointer up.
            // Both primary and secondary actions occur on Enter key up. The only exception
            // is secondary actions, which occur on double click with a mouse.
            if (e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === 'virtual' || e.pointerType === 'keyboard' && hasAction && $0d8cf6a15fe85601$var$isActionKey(e.key) || e.pointerType === 'mouse' && hadPrimaryActionOnPressStart.current) {
                if (hasAction) performAction(e);
                else if (allowsSelection) onSelect(e);
            }
        };
    }
    itemProps['data-collection'] = (0, $8f207f199487227b$export$6aeb1680a0ae8741)(manager.collection);
    itemProps['data-key'] = key;
    itemPressProps.preventFocusOnPress = shouldUseVirtualFocus;
    // When using virtual focus, make sure the focused key gets updated on press.
    if (shouldUseVirtualFocus) itemPressProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(itemPressProps, {
        onPressStart (e) {
            if (e.pointerType !== 'touch') {
                manager.setFocused(true);
                manager.setFocusedKey(key);
            }
        },
        onPress (e) {
            if (e.pointerType === 'touch') {
                manager.setFocused(true);
                manager.setFocusedKey(key);
            }
        }
    });
    if (collectionItemProps) {
        for (let key of [
            'onPressStart',
            'onPressEnd',
            'onPressChange',
            'onPress',
            'onPressUp',
            'onClick'
        ])if (collectionItemProps[key]) itemPressProps[key] = (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(itemPressProps[key], collectionItemProps[key]);
    }
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)(itemPressProps);
    // Double clicking with a mouse with selectionBehavior = 'replace' performs an action.
    let onDoubleClick = hasSecondaryAction ? (e)=>{
        if (modality.current === 'mouse') {
            e.stopPropagation();
            e.preventDefault();
            performAction(e);
        }
    } : undefined;
    // Long pressing an item with touch when selectionBehavior = 'replace' switches the selection behavior
    // to 'toggle'. This changes the single tap behavior from performing an action (i.e. navigating) to
    // selecting, and may toggle the appearance of a UI affordance like checkboxes on each item.
    let { longPressProps: longPressProps } = (0, $4a63d38d4cd3f004$export$c24ed0104d07eab9)({
        isDisabled: !longPressEnabled,
        onLongPress (e) {
            if (e.pointerType === 'touch') {
                onSelect(e);
                manager.setSelectionBehavior('toggle');
            }
        }
    });
    // Prevent native drag and drop on long press if we also select on long press.
    // Once the user is in selection mode, they can long press again to drag.
    // Use a capturing listener to ensure this runs before useDrag, regardless of
    // the order the props get merged.
    let onDragStartCapture = (e)=>{
        if (modality.current === 'touch' && longPressEnabledOnPressStart.current) e.preventDefault();
    };
    // Prevent default on link clicks so that we control exactly
    // when they open (to match selection behavior).
    let onClick = linkBehavior !== 'none' && manager.isLink(key) ? (e)=>{
        if (!(0, $044d3c97ce5d6621$export$95185d699e05d4d7).isOpening) e.preventDefault();
    } : undefined;
    return {
        itemProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(itemProps, allowsSelection || hasPrimaryAction || shouldUseVirtualFocus && !isDisabled ? pressProps : {}, longPressEnabled ? longPressProps : {}, {
            onDoubleClick: onDoubleClick,
            onDragStartCapture: onDragStartCapture,
            onClick: onClick,
            id: id
        }, // Prevent DOM focus from moving on mouse down when using virtual focus
        shouldUseVirtualFocus ? {
            onMouseDown: (e)=>e.preventDefault()
        } : undefined),
        isPressed: isPressed,
        isSelected: manager.isSelected(key),
        isFocused: manager.isFocused && manager.focusedKey === key,
        isDisabled: isDisabled,
        allowsSelection: allowsSelection,
        hasAction: hasAction
    };
}
function $0d8cf6a15fe85601$var$isActionKey(key) {
    return key === 'Enter';
}
function $0d8cf6a15fe85601$var$isSelectionKey(key) {
    return key === ' ';
}


export {$0d8cf6a15fe85601$export$ecf600387e221c37 as useSelectableItem};
//# sourceMappingURL=useSelectableItem.js.map
