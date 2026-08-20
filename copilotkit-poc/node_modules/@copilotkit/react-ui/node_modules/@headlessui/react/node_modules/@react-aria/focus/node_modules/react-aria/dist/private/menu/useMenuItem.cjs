var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $6ddbbc622e966e2c$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $eb87b11bb9010ec1$exports = require("../interactions/useHover.cjs");
var $6d2f10bb8b359da5$exports = require("../interactions/useKeyboard.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $gYnjI$reactstatelyprivatecollectionsgetItemCount = require("react-stately/private/collections/getItemCount");
var $gYnjI$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useMenuItem", function () { return $6f94764398dea248$export$9d32628fc2aea7da; });
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













function $6f94764398dea248$export$9d32628fc2aea7da(props, state, ref) {
    let { id: id, key: key, closeOnSelect: closeOnSelect, shouldCloseOnSelect: shouldCloseOnSelect, isVirtualized: isVirtualized, 'aria-haspopup': hasPopup, onPressStart: onPressStart, onPressUp: pressUpProp, onPress: onPress, onPressChange: pressChangeProp, onPressEnd: onPressEnd, onClick: onClickProp, onHoverStart: hoverStartProp, onHoverChange: onHoverChange, onHoverEnd: onHoverEnd, onKeyDown: onKeyDown, onKeyUp: onKeyUp, onFocus: onFocus, onFocusChange: onFocusChange, onBlur: onBlur, selectionManager: selectionManager = state.selectionManager } = props;
    let isTrigger = !!hasPopup;
    let isTriggerExpanded = isTrigger && props['aria-expanded'] === 'true';
    let isDisabled = props.isDisabled ?? selectionManager.isDisabled(key);
    let isSelected = props.isSelected ?? selectionManager.isSelected(key);
    let data = (0, $6ddbbc622e966e2c$exports.menuData).get(state);
    let item = state.collection.getItem(key);
    let onClose = props.onClose || data.onClose;
    let router = (0, $75bd88aab025820b$exports.useRouter)();
    let performAction = ()=>{
        if (isTrigger) return;
        if (item?.props?.onAction) item.props.onAction();
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
    let labelId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    let descriptionId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
    let keyboardId = (0, $7ac82d1fee77eb8a$exports.useSlotId)();
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
        let index = Number(item?.index);
        ariaProps['aria-posinset'] = Number.isNaN(index) ? undefined : index + 1;
        ariaProps['aria-setsize'] = (0, $gYnjI$reactstatelyprivatecollectionsgetItemCount.getItemCount)(state.collection);
    }
    let isPressedRef = (0, $gYnjI$react.useRef)(false);
    let onPressChange = (isPressed)=>{
        pressChangeProp?.(isPressed);
        isPressedRef.current = isPressed;
    };
    let interaction = (0, $gYnjI$react.useRef)(null);
    let onPressUp = (e)=>{
        if (e.pointerType !== 'keyboard') interaction.current = {
            pointerType: e.pointerType
        };
        // If interacting with mouse, allow the user to mouse down on the trigger button,
        // drag, and release over an item (matching native behavior).
        if (e.pointerType === 'mouse') {
            if (!isPressedRef.current) e.target.click();
        }
        pressUpProp?.(e);
    };
    let onClick = (e)=>{
        onClickProp?.(e);
        performAction();
        (0, $75bd88aab025820b$exports.handleLinkClick)(e, router, item.props.href, item?.props.routerOptions);
        let shouldClose = interaction.current?.pointerType === 'keyboard' ? interaction.current?.key === 'Enter' || selectionManager.selectionMode === 'none' || selectionManager.isLink(key) : selectionManager.selectionMode !== 'multiple' || selectionManager.isLink(key);
        shouldClose = shouldCloseOnSelect ?? closeOnSelect ?? shouldClose;
        if (onClose && !isTrigger && shouldClose) onClose();
        interaction.current = null;
    };
    let { itemProps: itemProps, isFocused: isFocused } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
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
    let { pressProps: pressProps, isPressed: isPressed } = (0, $1d003dcb6308cd89$exports.usePress)({
        onPressStart: onPressStart,
        onPress: onPress,
        onPressUp: onPressUp,
        onPressChange: onPressChange,
        onPressEnd: onPressEnd,
        isDisabled: isDisabled
    });
    let { hoverProps: hoverProps } = (0, $eb87b11bb9010ec1$exports.useHover)({
        isDisabled: isDisabled,
        onHoverStart (e) {
            // Hovering over an already expanded sub dialog trigger should keep focus in the dialog.
            if (!(0, $d0df89f3abe2c2ca$exports.isFocusVisible)() && !(isTriggerExpanded && hasPopup)) {
                selectionManager.setFocused(true);
                selectionManager.setFocusedKey(key);
            }
            hoverStartProp?.(e);
        },
        onHoverChange: onHoverChange,
        onHoverEnd: onHoverEnd
    });
    let { keyboardProps: keyboardProps } = (0, $6d2f10bb8b359da5$exports.useKeyboard)({
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
                    (0, $da02ee888921bc9e$exports.getEventTarget)(e).click();
                    // click above sets modality to "virtual", need to set interaction modality back to 'keyboard' so focusSafely calls properly move focus
                    // to the newly opened submenu's first item.
                    (0, $d0df89f3abe2c2ca$exports.setInteractionModality)('keyboard');
                    break;
                case 'Enter':
                    interaction.current = {
                        pointerType: 'keyboard',
                        key: 'Enter'
                    };
                    // Trigger click unless this is a link. Links trigger click natively.
                    if ((0, $da02ee888921bc9e$exports.getEventTarget)(e).tagName !== 'A') (0, $da02ee888921bc9e$exports.getEventTarget)(e).click();
                    // click above sets modality to "virtual", need to set interaction modality back to 'keyboard' so focusSafely calls properly move focus
                    // to the newly opened submenu's first item.
                    (0, $d0df89f3abe2c2ca$exports.setInteractionModality)('keyboard');
                    break;
                default:
                    if (!isTrigger) e.continuePropagation();
                    onKeyDown?.(e);
                    break;
            }
        },
        onKeyUp: onKeyUp
    });
    let { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)({
        onBlur: onBlur,
        onFocus: onFocus,
        onFocusChange: onFocusChange
    }, ref);
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(item?.props);
    delete domProps.id;
    let linkProps = (0, $75bd88aab025820b$exports.useLinkProps)(item?.props);
    return {
        menuItemProps: {
            ...ariaProps,
            ...(0, $89b39774f3b79dbb$exports.mergeProps)(domProps, linkProps, isTrigger ? {
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
        isFocusVisible: isFocused && selectionManager.isFocused && (0, $d0df89f3abe2c2ca$exports.isFocusVisible)() && !isTriggerExpanded,
        isSelected: isSelected,
        isPressed: isPressed,
        isDisabled: isDisabled
    };
}


//# sourceMappingURL=useMenuItem.cjs.map
