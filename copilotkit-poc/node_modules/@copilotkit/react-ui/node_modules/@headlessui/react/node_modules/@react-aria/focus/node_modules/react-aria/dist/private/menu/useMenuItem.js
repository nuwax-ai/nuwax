import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {handleLinkClick as $044d3c97ce5d6621$export$13aea1a3cb5e3f1f, useLinkProps as $044d3c97ce5d6621$export$7e924b3091a3bd18, useRouter as $044d3c97ce5d6621$export$9a302a45f65d0572} from "../utils/openLink.js";
import {isFocusVisible as $b50b1cc8a843ace7$export$b9b3dfddab17db27, setInteractionModality as $b50b1cc8a843ace7$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.js";
import {menuData as $5c01de64eca9d4dd$export$6f49b4016bfc8d56} from "./utils.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useFocusable as $088f27a386bc4a8f$export$4c014de7c8940b4c} from "../interactions/useFocusable.js";
import {useHover as $f7f05710dfc01c4c$export$ae780daf29e6d456} from "../interactions/useHover.js";
import {useKeyboard as $bf74df7506f65576$export$8f71654801c2f7cd} from "../interactions/useKeyboard.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useSelectableItem as $0d8cf6a15fe85601$export$ecf600387e221c37} from "../selection/useSelectableItem.js";
import {useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";
import {getItemCount as $a0x2L$getItemCount} from "react-stately/private/collections/getItemCount";
import {useRef as $a0x2L$useRef} from "react";

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













function $9ece3e86cfe4d555$export$9d32628fc2aea7da(props, state, ref) {
    let { id: id, key: key, closeOnSelect: closeOnSelect, shouldCloseOnSelect: shouldCloseOnSelect, isVirtualized: isVirtualized, 'aria-haspopup': hasPopup, onPressStart: onPressStart, onPressUp: pressUpProp, onPress: onPress, onPressChange: pressChangeProp, onPressEnd: onPressEnd, onClick: onClickProp, onHoverStart: hoverStartProp, onHoverChange: onHoverChange, onHoverEnd: onHoverEnd, onKeyDown: onKeyDown, onKeyUp: onKeyUp, onFocus: onFocus, onFocusChange: onFocusChange, onBlur: onBlur, selectionManager: selectionManager = state.selectionManager } = props;
    let isTrigger = !!hasPopup;
    let isTriggerExpanded = isTrigger && props['aria-expanded'] === 'true';
    var _props_isDisabled;
    let isDisabled = (_props_isDisabled = props.isDisabled) !== null && _props_isDisabled !== void 0 ? _props_isDisabled : selectionManager.isDisabled(key);
    var _props_isSelected;
    let isSelected = (_props_isSelected = props.isSelected) !== null && _props_isSelected !== void 0 ? _props_isSelected : selectionManager.isSelected(key);
    let data = (0, $5c01de64eca9d4dd$export$6f49b4016bfc8d56).get(state);
    let item = state.collection.getItem(key);
    let onClose = props.onClose || data.onClose;
    let router = (0, $044d3c97ce5d6621$export$9a302a45f65d0572)();
    let performAction = ()=>{
        var _item_props;
        if (isTrigger) return;
        if (item === null || item === void 0 ? void 0 : (_item_props = item.props) === null || _item_props === void 0 ? void 0 : _item_props.onAction) item.props.onAction();
        else if (props.onAction) props.onAction(key);
        if (data.onAction) {
            // Must reassign to variable otherwise `this` binding gets messed up. Something to do with WeakMap.
            let onAction = data.onAction;
            onAction(key);
        }
    };
    let role = 'menuitem';
    if (!isTrigger) {
        if (selectionManager.selectionMode === 'single') role = 'menuitemradio';
        else if (selectionManager.selectionMode === 'multiple') role = 'menuitemcheckbox';
    }
    let labelId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let descriptionId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let keyboardId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)();
    let ariaProps = {
        id: id,
        'aria-disabled': isDisabled || undefined,
        role: role,
        'aria-label': props['aria-label'],
        'aria-labelledby': labelId,
        'aria-describedby': [
            props['aria-describedby'],
            descriptionId,
            keyboardId
        ].filter(Boolean).join(' ') || undefined,
        'aria-controls': props['aria-controls'],
        'aria-haspopup': hasPopup,
        'aria-expanded': props['aria-expanded']
    };
    if (selectionManager.selectionMode !== 'none' && !isTrigger) ariaProps['aria-checked'] = isSelected;
    if (isVirtualized) {
        let index = Number(item === null || item === void 0 ? void 0 : item.index);
        ariaProps['aria-posinset'] = Number.isNaN(index) ? undefined : index + 1;
        ariaProps['aria-setsize'] = (0, $a0x2L$getItemCount)(state.collection);
    }
    let isPressedRef = (0, $a0x2L$useRef)(false);
    let onPressChange = (isPressed)=>{
        pressChangeProp === null || pressChangeProp === void 0 ? void 0 : pressChangeProp(isPressed);
        isPressedRef.current = isPressed;
    };
    let interaction = (0, $a0x2L$useRef)(null);
    let onPressUp = (e)=>{
        if (e.pointerType !== 'keyboard') interaction.current = {
            pointerType: e.pointerType
        };
        // If interacting with mouse, allow the user to mouse down on the trigger button,
        // drag, and release over an item (matching native behavior).
        if (e.pointerType === 'mouse') {
            if (!isPressedRef.current) e.target.click();
        }
        pressUpProp === null || pressUpProp === void 0 ? void 0 : pressUpProp(e);
    };
    let onClick = (e)=>{
        var _interaction_current, _interaction_current1;
        onClickProp === null || onClickProp === void 0 ? void 0 : onClickProp(e);
        performAction();
        (0, $044d3c97ce5d6621$export$13aea1a3cb5e3f1f)(e, router, item.props.href, item === null || item === void 0 ? void 0 : item.props.routerOptions);
        let shouldClose = ((_interaction_current = interaction.current) === null || _interaction_current === void 0 ? void 0 : _interaction_current.pointerType) === 'keyboard' ? ((_interaction_current1 = interaction.current) === null || _interaction_current1 === void 0 ? void 0 : _interaction_current1.key) === 'Enter' || selectionManager.selectionMode === 'none' || selectionManager.isLink(key) : selectionManager.selectionMode !== 'multiple' || selectionManager.isLink(key);
        var _ref;
        shouldClose = (_ref = shouldCloseOnSelect !== null && shouldCloseOnSelect !== void 0 ? shouldCloseOnSelect : closeOnSelect) !== null && _ref !== void 0 ? _ref : shouldClose;
        if (onClose && !isTrigger && shouldClose) onClose();
        interaction.current = null;
    };
    let { itemProps: itemProps, isFocused: isFocused } = (0, $0d8cf6a15fe85601$export$ecf600387e221c37)({
        id: id,
        selectionManager: selectionManager,
        key: key,
        ref: ref,
        shouldSelectOnPressUp: true,
        allowsDifferentPressOrigin: true,
        // Disable all handling of links in useSelectable item
        // because we handle it ourselves. The behavior of menus
        // is slightly different from other collections because
        // actions are performed on key down rather than key up.
        linkBehavior: 'none',
        shouldUseVirtualFocus: data.shouldUseVirtualFocus
    });
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        onPressStart: onPressStart,
        onPress: onPress,
        onPressUp: onPressUp,
        onPressChange: onPressChange,
        onPressEnd: onPressEnd,
        isDisabled: isDisabled
    });
    let { hoverProps: hoverProps } = (0, $f7f05710dfc01c4c$export$ae780daf29e6d456)({
        isDisabled: isDisabled,
        onHoverStart (e) {
            // Hovering over an already expanded sub dialog trigger should keep focus in the dialog.
            if (!(0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)() && !(isTriggerExpanded && hasPopup)) {
                selectionManager.setFocused(true);
                selectionManager.setFocusedKey(key);
            }
            hoverStartProp === null || hoverStartProp === void 0 ? void 0 : hoverStartProp(e);
        },
        onHoverChange: onHoverChange,
        onHoverEnd: onHoverEnd
    });
    let { keyboardProps: keyboardProps } = (0, $bf74df7506f65576$export$8f71654801c2f7cd)({
        onKeyDown: (e)=>{
            // Ignore repeating events, which may have started on the menu trigger before moving
            // focus to the menu item. We want to wait for a second complete key press sequence.
            if (e.repeat) {
                e.continuePropagation();
                return;
            }
            switch(e.key){
                case ' ':
                    interaction.current = {
                        pointerType: 'keyboard',
                        key: ' '
                    };
                    (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).click();
                    // click above sets modality to "virtual", need to set interaction modality back to 'keyboard' so focusSafely calls properly move focus
                    // to the newly opened submenu's first item.
                    (0, $b50b1cc8a843ace7$export$8397ddfc504fdb9a)('keyboard');
                    break;
                case 'Enter':
                    interaction.current = {
                        pointerType: 'keyboard',
                        key: 'Enter'
                    };
                    // Trigger click unless this is a link. Links trigger click natively.
                    if ((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).tagName !== 'A') (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).click();
                    // click above sets modality to "virtual", need to set interaction modality back to 'keyboard' so focusSafely calls properly move focus
                    // to the newly opened submenu's first item.
                    (0, $b50b1cc8a843ace7$export$8397ddfc504fdb9a)('keyboard');
                    break;
                default:
                    if (!isTrigger) e.continuePropagation();
                    onKeyDown === null || onKeyDown === void 0 ? void 0 : onKeyDown(e);
                    break;
            }
        },
        onKeyUp: onKeyUp
    });
    let { focusableProps: focusableProps } = (0, $088f27a386bc4a8f$export$4c014de7c8940b4c)({
        onBlur: onBlur,
        onFocus: onFocus,
        onFocusChange: onFocusChange
    }, ref);
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(item === null || item === void 0 ? void 0 : item.props);
    delete domProps.id;
    let linkProps = (0, $044d3c97ce5d6621$export$7e924b3091a3bd18)(item === null || item === void 0 ? void 0 : item.props);
    return {
        menuItemProps: {
            ...ariaProps,
            ...(0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, linkProps, isTrigger ? {
                onFocus: itemProps.onFocus,
                'data-collection': itemProps['data-collection'],
                'data-key': itemProps['data-key']
            } : itemProps, pressProps, hoverProps, keyboardProps, focusableProps, // Prevent DOM focus from moving on mouse down when using virtual focus or this is a submenu/subdialog trigger.
            data.shouldUseVirtualFocus || isTrigger ? {
                onMouseDown: (e)=>e.preventDefault()
            } : undefined, isDisabled ? undefined : {
                onClick: onClick
            }),
            // If a submenu is expanded, set the tabIndex to -1 so that shift tabbing goes out of the menu instead of the parent menu item.
            tabIndex: itemProps.tabIndex != null && isTriggerExpanded && !data.shouldUseVirtualFocus ? -1 : itemProps.tabIndex
        },
        labelProps: {
            id: labelId
        },
        descriptionProps: {
            id: descriptionId
        },
        keyboardShortcutProps: {
            id: keyboardId
        },
        isFocused: isFocused,
        isFocusVisible: isFocused && selectionManager.isFocused && (0, $b50b1cc8a843ace7$export$b9b3dfddab17db27)() && !isTriggerExpanded,
        isSelected: isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled
    };
}


export {$9ece3e86cfe4d555$export$9d32628fc2aea7da as useMenuItem};
//# sourceMappingURL=useMenuItem.js.map
