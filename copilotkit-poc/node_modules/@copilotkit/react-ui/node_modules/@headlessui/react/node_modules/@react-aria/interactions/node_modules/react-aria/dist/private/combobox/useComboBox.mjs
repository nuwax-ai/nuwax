import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import {ariaHideOutside as $58196c8d6a1f38fc$export$1c3ebcada18427bf} from "../overlays/ariaHideOutside.mjs";
import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {dispatchVirtualFocus as $b72f3f7b3b5f42c6$export$2b35b76d2e30e129} from "../focus/virtualFocus.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getItemId as $cd088b5c0d7b27b4$export$9145995848b05025, listData as $cd088b5c0d7b27b4$export$3585ede4d035bf14} from "../listbox/utils.mjs";
import {getOwnerDocument as $d447af545b77c9f1$export$b204af158042fbac} from "../utils/domHelpers.mjs";
import $b3TGe$intlStringsmjs from "./intlStrings.mjs";
import {isAppleDevice as $2add3ce32c6007eb$export$e1865c3bedcd822b} from "../utils/platform.mjs";
import {ListKeyboardDelegate as $ae8f8d98b2b18f2f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "../utils/useEvent.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMenuTrigger as $f19b83c1486f45cc$export$dc9c12ed27dd1b49} from "../menu/useMenuTrigger.mjs";
import {useRouter as $caaf0dd3060ed57c$export$9a302a45f65d0572} from "../utils/openLink.mjs";
import {useSelectableCollection as $d667c2af82d35a98$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.mjs";
import {useTextField as $054f71d2330da2e3$export$712718f7aec83d5} from "../textfield/useTextField.mjs";
import {useUpdateEffect as $3c71b1595a147f24$export$496315a1608d9602} from "../utils/useUpdateEffect.mjs";
import {useRef as $b3TGe$useRef, useMemo as $b3TGe$useMemo, useEffect as $b3TGe$useEffect, useState as $b3TGe$useState} from "react";
import {getChildNodes as $b3TGe$getChildNodes} from "react-stately/private/collections/getChildNodes";
import {getItemCount as $b3TGe$getItemCount} from "react-stately/private/collections/getItemCount";
import {privateValidationStateProp as $b3TGe$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
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
























function $bf505c7417d9b616$export$8c18d1b4f7232bbf(props, state) {
    let { buttonRef: buttonRef, popoverRef: popoverRef, inputRef: inputRef, listBoxRef: listBoxRef, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, shouldFocusWrap: // completionMode = 'suggest',
    shouldFocusWrap, isReadOnly: isReadOnly, isDisabled: isDisabled } = props;
    let backupBtnRef = (0, $b3TGe$useRef)(null);
    buttonRef = buttonRef ?? backupBtnRef;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($b3TGe$intlStringsmjs))), '@react-aria/combobox');
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $f19b83c1486f45cc$export$dc9c12ed27dd1b49)({
        type: 'listbox',
        isDisabled: isDisabled || isReadOnly
    }, state, buttonRef);
    // Set listbox id so it can be used when calling getItemId later
    (0, $cd088b5c0d7b27b4$export$3585ede4d035bf14).set(state, {
        id: menuProps.id
    });
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let { collection: collection } = state;
    let { disabledKeys: disabledKeys } = state.selectionManager;
    let delegate = (0, $b3TGe$useMemo)(()=>keyboardDelegate || new (0, $ae8f8d98b2b18f2f$export$a05409b8bb224a5a)({
            collection: collection,
            disabledKeys: disabledKeys,
            ref: listBoxRef,
            layoutDelegate: layoutDelegate
        }), [
        keyboardDelegate,
        layoutDelegate,
        collection,
        disabledKeys,
        listBoxRef
    ]);
    // Use useSelectableCollection to get the keyboard handlers to apply to the textfield
    let { collectionProps: collectionProps } = (0, $d667c2af82d35a98$export$d6daf82dcd84e87c)({
        selectionManager: state.selectionManager,
        keyboardDelegate: delegate,
        disallowTypeAhead: true,
        disallowEmptySelection: true,
        shouldFocusWrap: shouldFocusWrap,
        ref: inputRef,
        // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
        isVirtualized: true
    });
    let router = (0, $caaf0dd3060ed57c$export$9a302a45f65d0572)();
    // For textfield specific keydown operations
    let onKeyDown = (e)=>{
        if (e.nativeEvent.isComposing) return;
        switch(e.key){
            case 'Enter':
            case 'Tab':
                // Prevent form submission if menu is open since we may be selecting a option
                if (state.isOpen && e.key === 'Enter') e.preventDefault();
                // If the focused item is a link, trigger opening it. Items that are links are not selectable.
                if (state.isOpen && listBoxRef.current && state.selectionManager.focusedKey != null) {
                    let collectionItem = state.collection.getItem(state.selectionManager.focusedKey);
                    if (collectionItem?.props.href) {
                        let item = listBoxRef.current.querySelector(`[data-key="${CSS.escape(state.selectionManager.focusedKey.toString())}"]`);
                        if (e.key === 'Enter' && item instanceof HTMLAnchorElement) router.open(item, e, collectionItem.props.href, collectionItem.props.routerOptions);
                        state.close();
                        break;
                    } else if (collectionItem?.props.onAction) {
                        collectionItem.props.onAction();
                        state.close();
                        break;
                    }
                }
                if (e.key === 'Enter' || state.isOpen) state.commit();
                break;
            case 'Escape':
                if (!state.selectionManager.isEmpty || state.inputValue === '' || props.allowsCustomValue) e.continuePropagation();
                state.revert();
                break;
            case 'ArrowDown':
                state.open('first', 'manual');
                break;
            case 'ArrowUp':
                state.open('last', 'manual');
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                state.selectionManager.setFocusedKey(null);
                break;
        }
    };
    let onBlur = (e)=>{
        let blurFromButton = buttonRef?.current && buttonRef.current === e.relatedTarget;
        let blurIntoPopover = (0, $23f2114a1b82827e$export$4282f70798064fe0)(popoverRef.current, e.relatedTarget);
        // Ignore blur if focused moved to the button(if exists) or into the popover.
        if (blurFromButton || blurIntoPopover) return;
        if (props.onBlur) props.onBlur(e);
        state.setFocused(false);
    };
    let onFocus = (e)=>{
        if (state.isFocused) return;
        if (props.onFocus) props.onFocus(e);
        state.setFocused(true);
    };
    let valueId = $bf505c7417d9b616$var$useValueId([
        state.selectionManager.selectedKeys,
        state.selectionManager.selectionMode
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $054f71d2330da2e3$export$712718f7aec83d5)({
        ...props,
        // In multi-select mode, only set required if the selection is empty.
        isRequired: props.selectionMode === 'multiple' ? props.isRequired && state.selectionManager.isEmpty : props.isRequired,
        onChange: state.setInputValue,
        onKeyDown: !isReadOnly ? (0, $a4e76a5424781910$export$e08e3b67e392101e)(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown) : props.onKeyDown,
        onBlur: onBlur,
        value: state.inputValue,
        defaultValue: state.defaultInputValue,
        onFocus: onFocus,
        autoComplete: 'off',
        validate: undefined,
        [(0, $b3TGe$privateValidationStateProp)]: state,
        'aria-describedby': [
            valueId,
            props['aria-describedby']
        ].filter(Boolean).join(' ') || undefined
    }, inputRef);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(inputRef, state.defaultValue, state.setValue);
    // Press handlers for the ComboBox button
    let onPress = (e)=>{
        if (e.pointerType === 'touch') {
            // Focus the input field in case it isn't focused yet
            inputRef.current?.focus();
            state.toggle(null, 'manual');
        }
    };
    let onPressStart = (e)=>{
        if (e.pointerType !== 'touch') {
            inputRef.current?.focus();
            state.toggle(e.pointerType === 'keyboard' || e.pointerType === 'virtual' ? 'first' : null, 'manual');
        }
    };
    let triggerLabelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        id: menuTriggerProps.id,
        'aria-label': stringFormatter.format('buttonLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    let listBoxProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        id: menuProps.id,
        'aria-label': stringFormatter.format('listboxLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
    let lastEventTime = (0, $b3TGe$useRef)(0);
    let onTouchEnd = (e)=>{
        if (isDisabled || isReadOnly) return;
        // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
        if (e.timeStamp - lastEventTime.current < 500) {
            e.preventDefault();
            inputRef.current?.focus();
            return;
        }
        let rect = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e).getBoundingClientRect();
        let touch = e.changedTouches[0];
        let centerX = Math.ceil(rect.left + 0.5 * rect.width);
        let centerY = Math.ceil(rect.top + 0.5 * rect.height);
        if (touch.clientX === centerX && touch.clientY === centerY) {
            e.preventDefault();
            inputRef.current?.focus();
            state.toggle(null, 'manual');
            lastEventTime.current = e.timeStamp;
        }
    };
    // VoiceOver has issues with announcing aria-activedescendant properly on change
    // (especially on iOS). We use a live region announcer to announce focus changes
    // manually. In addition, section titles are announced when navigating into a new section.
    let focusedItem = state.selectionManager.focusedKey != null && state.isOpen ? state.collection.getItem(state.selectionManager.focusedKey) : undefined;
    let sectionKey = focusedItem?.parentKey ?? null;
    let itemKey = state.selectionManager.focusedKey ?? null;
    let lastSection = (0, $b3TGe$useRef)(sectionKey);
    let lastItem = (0, $b3TGe$useRef)(itemKey);
    (0, $b3TGe$useEffect)(()=>{
        if ((0, $2add3ce32c6007eb$export$e1865c3bedcd822b)() && focusedItem != null && itemKey != null && itemKey !== lastItem.current) {
            let isSelected = state.selectionManager.isSelected(itemKey);
            let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
            let sectionTitle = section?.['aria-label'] || (typeof section?.rendered === 'string' ? section.rendered : '') || '';
            let announcement = stringFormatter.format('focusAnnouncement', {
                isGroupChange: (section && sectionKey !== lastSection.current) ?? false,
                groupTitle: sectionTitle,
                groupCount: section ? [
                    ...(0, $b3TGe$getChildNodes)(section, state.collection)
                ].length : 0,
                optionText: focusedItem['aria-label'] || focusedItem.textValue || '',
                isSelected: isSelected
            });
            (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSection.current = sectionKey;
        lastItem.current = itemKey;
    });
    // Announce the number of available suggestions when it changes
    let optionCount = (0, $b3TGe$getItemCount)(state.collection);
    let lastSize = (0, $b3TGe$useRef)(optionCount);
    let lastOpen = (0, $b3TGe$useRef)(state.isOpen);
    (0, $b3TGe$useEffect)(()=>{
        // Only announce the number of options available when the menu opens if there is no
        // focused item, otherwise screen readers will typically read e.g. "1 of 6".
        // The exception is VoiceOver since this isn't included in the message above.
        let didOpenWithoutFocusedItem = state.isOpen !== lastOpen.current && (state.selectionManager.focusedKey == null || (0, $2add3ce32c6007eb$export$e1865c3bedcd822b)());
        if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
            let announcement = stringFormatter.format('countAnnouncement', {
                optionCount: optionCount
            });
            (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSize.current = optionCount;
        lastOpen.current = state.isOpen;
    });
    // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
    // TODO: do we need to do this for multi-select?
    let lastSelectedKey = (0, $b3TGe$useRef)(state.selectedKey);
    (0, $b3TGe$useEffect)(()=>{
        if ((0, $2add3ce32c6007eb$export$e1865c3bedcd822b)() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
            let optionText = state.selectedItem['aria-label'] || state.selectedItem.textValue || '';
            let announcement = stringFormatter.format('selectedAnnouncement', {
                optionText: optionText
            });
            (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSelectedKey.current = state.selectedKey;
    });
    (0, $b3TGe$useEffect)(()=>{
        if (state.isOpen) return (0, $58196c8d6a1f38fc$export$1c3ebcada18427bf)([
            inputRef.current,
            popoverRef.current
        ].filter((element)=>element != null));
    }, [
        state.isOpen,
        inputRef,
        popoverRef
    ]);
    (0, $3c71b1595a147f24$export$496315a1608d9602)(()=>{
        // Re-show focus ring when there is no virtually focused item.
        if (!focusedItem && inputRef.current && (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)((0, $d447af545b77c9f1$export$b204af158042fbac)(inputRef.current)) === inputRef.current) (0, $b72f3f7b3b5f42c6$export$2b35b76d2e30e129)(inputRef.current, null);
    }, [
        focusedItem
    ]);
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(listBoxRef, 'react-aria-item-action', state.isOpen ? ()=>{
        state.close();
    } : undefined);
    return {
        labelProps: labelProps,
        buttonProps: {
            ...menuTriggerProps,
            ...triggerLabelProps,
            excludeFromTabOrder: true,
            preventFocusOnPress: true,
            onPress: onPress,
            onPressStart: onPressStart,
            isDisabled: isDisabled || isReadOnly
        },
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(inputProps, {
            role: 'combobox',
            'aria-expanded': menuTriggerProps['aria-expanded'],
            'aria-controls': state.isOpen ? menuProps.id : undefined,
            // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
            'aria-autocomplete': 'list',
            'aria-activedescendant': focusedItem ? (0, $cd088b5c0d7b27b4$export$9145995848b05025)(state, focusedItem.key) : undefined,
            onTouchEnd: onTouchEnd,
            // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
            autoCorrect: 'off',
            // This disable's the macOS Safari spell check auto corrections.
            spellCheck: 'false'
        }),
        listBoxProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(menuProps, listBoxProps, {
            autoFocus: state.focusStrategy || true,
            shouldUseVirtualFocus: true,
            shouldSelectOnPressUp: true,
            shouldFocusOnHover: true,
            linkBehavior: 'selection',
            ['UNSTABLE_itemBehavior']: 'action'
        }),
        valueProps: {
            id: valueId
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}
// This is a modified version of useSlotId that uses useEffect instead of useLayoutEffect.
// Triggering re-renders from useLayoutEffect breaks useComboBoxState's useEffect logic in React 18.
// These re-renders preempt async state updates in the useEffect, which ends up running multiple times
// prior to the state being updated. This results in onSelectionChange being called multiple times.
// TODO: refactor useComboBoxState to avoid this.
function $bf505c7417d9b616$var$useValueId(depArray = []) {
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    let [exists, setExists] = (0, $b3TGe$useState)(true);
    let [lastDeps, setLastDeps] = (0, $b3TGe$useState)(depArray);
    // If the deps changed, set exists to true so we can test whether the element exists.
    if (lastDeps.some((v, i)=>!Object.is(v, depArray[i]))) {
        setExists(true);
        setLastDeps(depArray);
    }
    (0, $b3TGe$useEffect)(()=>{
        if (exists && !document.getElementById(id)) // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setExists(false);
    }, [
        id,
        exists,
        lastDeps
    ]);
    return exists ? id : undefined;
}


export {$bf505c7417d9b616$export$8c18d1b4f7232bbf as useComboBox};
//# sourceMappingURL=useComboBox.mjs.map
