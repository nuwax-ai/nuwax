import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, isFocusWithin as $d8ac7ed472840322$export$b4f377a2b6254582, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSafelyMouseToSubmenu as $43575285b6c61e86$export$85ec83e04c95f50a} from "./useSafelyMouseToSubmenu.js";
import {useRef as $iVOpM$useRef, useCallback as $iVOpM$useCallback} from "react";

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







function $fe3245d1ec1813d3$export$7138b0d059a6e743(props, state, ref) {
    let { parentMenuRef: parentMenuRef, submenuRef: submenuRef, type: type = 'menu', isDisabled: isDisabled, delay: delay = 200, shouldUseVirtualFocus: shouldUseVirtualFocus } = props;
    let submenuTriggerId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let overlayId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let openTimeout = (0, $iVOpM$useRef)(undefined);
    let cancelOpenTimeout = (0, $iVOpM$useCallback)(()=>{
        if (openTimeout.current) {
            clearTimeout(openTimeout.current);
            openTimeout.current = undefined;
        }
    }, [
        openTimeout
    ]);
    let onSubmenuOpen = (0, $iVOpM$useCallback)((focusStrategy)=>{
        cancelOpenTimeout();
        state.open(focusStrategy);
    }, [
        state,
        cancelOpenTimeout
    ]);
    let onSubmenuClose = (0, $iVOpM$useCallback)(()=>{
        cancelOpenTimeout();
        state.close();
    }, [
        state,
        cancelOpenTimeout
    ]);
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        return ()=>{
            cancelOpenTimeout();
        };
    }, [
        cancelOpenTimeout
    ]);
    let submenuKeyDown = (e)=>{
        // If focus is not within the menu, assume virtual focus is being used.
        // This means some other input element is also within the popover, so we shouldn't close the menu.
        if (!(0, $d8ac7ed472840322$export$b4f377a2b6254582)(e.currentTarget)) return;
        switch(e.key){
            case 'ArrowLeft':
                if (direction === 'ltr' && (0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $d559d872031c749f$export$de79e2c695e052f3)(ref.current);
                }
                break;
            case 'ArrowRight':
                if (direction === 'rtl' && (0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                    e.preventDefault();
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $d559d872031c749f$export$de79e2c695e052f3)(ref.current);
                }
                break;
            case 'Escape':
                // TODO: can remove this when we fix collection event leaks
                if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(submenuRef.current, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e))) {
                    e.stopPropagation();
                    onSubmenuClose();
                    if (!shouldUseVirtualFocus && ref.current) (0, $d559d872031c749f$export$de79e2c695e052f3)(ref.current);
                }
                break;
        }
    };
    var _state_focusStrategy;
    let submenuProps = {
        id: overlayId,
        'aria-labelledby': submenuTriggerId,
        submenuLevel: state.submenuLevel,
        ...type === 'menu' && {
            onClose: state.closeAll,
            autoFocus: (_state_focusStrategy = state.focusStrategy) !== null && _state_focusStrategy !== void 0 ? _state_focusStrategy : undefined,
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
                        if (type === 'menu' && !!(submenuRef === null || submenuRef === void 0 ? void 0 : submenuRef.current) && (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === (ref === null || ref === void 0 ? void 0 : ref.current)) (0, $d559d872031c749f$export$de79e2c695e052f3)(submenuRef.current);
                    } else if (state.isOpen) onSubmenuClose();
                    else e.continuePropagation();
                }
                break;
            case 'ArrowLeft':
                if (!isDisabled) {
                    if (direction === 'rtl') {
                        e.preventDefault();
                        if (!state.isOpen) onSubmenuOpen('first');
                        if (type === 'menu' && !!(submenuRef === null || submenuRef === void 0 ? void 0 : submenuRef.current) && (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === (ref === null || ref === void 0 ? void 0 : ref.current)) (0, $d559d872031c749f$export$de79e2c695e052f3)(submenuRef.current);
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
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(parentMenuRef, 'focusin', (e)=>{
        // If we detect focus moved to a different item in the same menu that the currently open submenu trigger is in
        // then close the submenu. This is for a case where the user hovers a root menu item when multiple submenus are open
        if (state.isOpen && (0, $d8ac7ed472840322$export$4282f70798064fe0)(parentMenuRef.current, (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e)) && (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e) !== ref.current) onSubmenuClose();
    });
    let shouldCloseOnInteractOutside = (target)=>{
        if (target !== ref.current) return true;
        return false;
    };
    (0, $43575285b6c61e86$export$85ec83e04c95f50a)({
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


export {$fe3245d1ec1813d3$export$7138b0d059a6e743 as useSubmenuTrigger};
//# sourceMappingURL=useSubmenuTrigger.js.map
