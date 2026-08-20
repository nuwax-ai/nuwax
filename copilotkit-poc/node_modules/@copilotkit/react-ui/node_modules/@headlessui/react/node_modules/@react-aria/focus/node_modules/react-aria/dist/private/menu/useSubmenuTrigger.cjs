var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $429333cab433657c$exports = require("../utils/useLayoutEffect.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $654d0dc3db8fecae$exports = require("./useSafelyMouseToSubmenu.cjs");
var $03oVZ$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSubmenuTrigger", function () { return $205b9b8d44a53639$export$7138b0d059a6e743; });
/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 







function $205b9b8d44a53639$export$7138b0d059a6e743(props, state, ref) {
    let { parentMenuRef: parentMenuRef, submenuRef: submenuRef, type: type = 'menu', isDisabled: isDisabled, delay: delay = 200, shouldUseVirtualFocus: shouldUseVirtualFocus } = props;
    let submenuTriggerId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let overlayId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let openTimeout = (0, $03oVZ$react.useRef)(undefined);
    let cancelOpenTimeout = (0, $03oVZ$react.useCallback)(()=>{
        if (openTimeout.current) {
            clearTimeout(openTimeout.current);
            openTimeout.current = undefined;
        }
    }, [
        openTimeout
    ]);
    let onSubmenuOpen = (0, $03oVZ$react.useCallback)((focusStrategy)=>{
        cancelOpenTimeout();
        state.open(focusStrategy);
    }, [
        state,
        cancelOpenTimeout
    ]);
    let onSubmenuClose = (0, $03oVZ$react.useCallback)(()=>{
        cancelOpenTimeout();
        state.close();
    }, [
        state,
        cancelOpenTimeout
    ]);
    (0, $429333cab433657c$exports.useLayoutEffect)(()=>{
        return ()=>{
            cancelOpenTimeout();
        };
    }, [
        cancelOpenTimeout
    ]);
    let submenuKeyDown = (e)=>{
        // If focus is not within the menu, assume virtual focus is being used.
        // This means some other input element is also within the popover, so we shouldn't close the menu.
        if (!(0, $da02ee888921bc9e$exports.isFocusWithin)(e.currentTarget)) return;
        switch(e.key){
            case 'ArrowLeft':
                if (direction === 'ltr' && (0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(ref.current);
                }
                break;
            case 'ArrowRight':
                if (direction === 'rtl' && (0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(ref.current);
                }
                break;
            case 'Escape':
                // TODO: can remove this when we fix collection event leaks
                if ((0, $da02ee888921bc9e$exports.nodeContains)(submenuRef.current, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(ref.current);
                }
                break;
        }
    };
    let submenuProps = {
        id: overlayId,
        'aria-labelledby': submenuTriggerId,
        submenuLevel: state.submenuLevel,
        ...type === 'menu' && {
            onClose: state.closeAll,
            autoFocus: state.focusStrategy ?? undefined,
            onKeyDown: submenuKeyDown
        }
    };
    let submenuTriggerKeyDown = (e)=>{
        switch(e.key){
            case 'ArrowRight':
                if (!isDisabled) {
                    if (direction === 'ltr') {
                        e.preventDefault();
                        if (!state.isOpen) onSubmenuOpen('first');
                        if (type === 'menu' && !!submenuRef?.current && (0, $da02ee888921bc9e$exports.getActiveElement)() === ref?.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(submenuRef.current);
                    } else if (state.isOpen) onSubmenuClose();
                    else e.continuePropagation();
                }
                break;
            case 'ArrowLeft':
                if (!isDisabled) {
                    if (direction === 'rtl') {
                        e.preventDefault();
                        if (!state.isOpen) onSubmenuOpen('first');
                        if (type === 'menu' && !!submenuRef?.current && (0, $da02ee888921bc9e$exports.getActiveElement)() === ref?.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(submenuRef.current);
                    } else if (state.isOpen) onSubmenuClose();
                    else e.continuePropagation();
                }
                break;
            default:
                e.continuePropagation();
                break;
        }
    };
    let onPressStart = (e)=>{
        if (!isDisabled && (e.pointerType === 'virtual' || e.pointerType === 'keyboard')) // If opened with a screen reader or keyboard, auto focus the first submenu item.
        onSubmenuOpen('first');
    };
    let onPress = (e)=>{
        if (!isDisabled && (e.pointerType === 'touch' || e.pointerType === 'mouse')) // For touch or on a desktop device with a small screen open on press up to possible problems with
        // press up happening on the newly opened tray items
        onSubmenuOpen();
    };
    let onHoverChange = (isHovered)=>{
        if (!isDisabled) {
            if (isHovered && !state.isOpen) {
                if (!openTimeout.current) openTimeout.current = setTimeout(()=>{
                    onSubmenuOpen();
                }, delay);
            } else if (!isHovered) cancelOpenTimeout();
        }
    };
    (0, $6e76e65001bbcda2$exports.useEvent)(parentMenuRef, 'focusin', (e)=>{
        // If we detect focus moved to a different item in the same menu that the currently open submenu trigger is in
        // then close the submenu. This is for a case where the user hovers a root menu item when multiple submenus are open
        if (state.isOpen && (0, $da02ee888921bc9e$exports.nodeContains)(parentMenuRef.current, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) && (0, $da02ee888921bc9e$exports.getEventTarget)(e) !== ref.current) onSubmenuClose();
    });
    let shouldCloseOnInteractOutside = (target)=>{
        if (target !== ref.current) return true;
        return false;
    };
    (0, $654d0dc3db8fecae$exports.useSafelyMouseToSubmenu)({
        menuRef: parentMenuRef,
        submenuRef: submenuRef,
        isOpen: state.isOpen,
        isDisabled: isDisabled
    });
    return {
        submenuTriggerProps: {
            id: submenuTriggerId,
            'aria-controls': state.isOpen ? overlayId : undefined,
            'aria-haspopup': !isDisabled ? type : undefined,
            'aria-expanded': state.isOpen ? 'true' : 'false',
            onPressStart: onPressStart,
            onPress: onPress,
            onHoverChange: onHoverChange,
            onKeyDown: submenuTriggerKeyDown,
            isOpen: state.isOpen
        },
        submenuProps: submenuProps,
        popoverProps: {
            isNonModal: true,
            shouldCloseOnInteractOutside: shouldCloseOnInteractOutside
        }
    };
}


//# sourceMappingURL=useSubmenuTrigger.cjs.map
