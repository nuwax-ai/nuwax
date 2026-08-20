import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import {ariaHideOutside as $20aa6983aa303ce6$export$1c3ebcada18427bf} from "../overlays/ariaHideOutside.js";
import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {dispatchVirtualFocus as $57a86975180d30a8$export$2b35b76d2e30e129} from "../focus/virtualFocus.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getItemId as $519a33be2aaefa45$export$9145995848b05025, listData as $519a33be2aaefa45$export$3585ede4d035bf14} from "../listbox/utils.js";
import {getOwnerDocument as $cc3c3666b64debad$export$b204af158042fbac} from "../utils/domHelpers.js";
import $6EqVl$intlStringsjs from "./intlStrings.js";
import {isAppleDevice as $d5a2be505488529f$export$e1865c3bedcd822b} from "../utils/platform.js";
import {ListKeyboardDelegate as $abb04fbee71f000f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useMenuTrigger as $5b0efffb5b3e0cc9$export$dc9c12ed27dd1b49} from "../menu/useMenuTrigger.js";
import {useRouter as $044d3c97ce5d6621$export$9a302a45f65d0572} from "../utils/openLink.js";
import {useSelectableCollection as $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c} from "../selection/useSelectableCollection.js";
import {useTextField as $032ede929f47bd98$export$712718f7aec83d5} from "../textfield/useTextField.js";
import {useUpdateEffect as $b444858e8a82ccea$export$496315a1608d9602} from "../utils/useUpdateEffect.js";
import {useRef as $6EqVl$useRef, useMemo as $6EqVl$useMemo, useEffect as $6EqVl$useEffect, useState as $6EqVl$useState} from "react";
import {getChildNodes as $6EqVl$getChildNodes} from "react-stately/private/collections/getChildNodes";
import {getItemCount as $6EqVl$getItemCount} from "react-stately/private/collections/getItemCount";
import {privateValidationStateProp as $6EqVl$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";


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
























function $61b9b89d5634b83f$export$8c18d1b4f7232bbf(props, state) {
    let { buttonRef: buttonRef, popoverRef: popoverRef, inputRef: inputRef, listBoxRef: listBoxRef, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, shouldFocusWrap: // completionMode = 'suggest',
    shouldFocusWrap, isReadOnly: isReadOnly, isDisabled: isDisabled } = props;
    let backupBtnRef = (0, $6EqVl$useRef)(null);
    buttonRef = buttonRef !== null && buttonRef !== void 0 ? buttonRef : backupBtnRef;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($6EqVl$intlStringsjs))), '@react-aria/combobox');
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $5b0efffb5b3e0cc9$export$dc9c12ed27dd1b49)({
        type: 'listbox',
        isDisabled: isDisabled || isReadOnly
    }, state, buttonRef);
    // Set listbox id so it can be used when calling getItemId later
    (0, $519a33be2aaefa45$export$3585ede4d035bf14).set(state, {
        id: menuProps.id
    });
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let { collection: collection } = state;
    let { disabledKeys: disabledKeys } = state.selectionManager;
    let delegate = (0, $6EqVl$useMemo)(()=>keyboardDelegate || new (0, $abb04fbee71f000f$export$a05409b8bb224a5a)({
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
    let { collectionProps: collectionProps } = (0, $80c8b4b5cf8e1f86$export$d6daf82dcd84e87c)({
        selectionManager: state.selectionManager,
        keyboardDelegate: delegate,
        disallowTypeAhead: true,
        disallowEmptySelection: true,
        shouldFocusWrap: shouldFocusWrap,
        ref: inputRef,
        // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
        isVirtualized: true
    });
    let router = (0, $044d3c97ce5d6621$export$9a302a45f65d0572)();
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
                    if (collectionItem === null || collectionItem === void 0 ? void 0 : collectionItem.props.href) {
                        let item = listBoxRef.current.querySelector(`[data-key="${CSS.escape(state.selectionManager.focusedKey.toString())}"]`);
                        if (e.key === 'Enter' && item instanceof HTMLAnchorElement) router.open(item, e, collectionItem.props.href, collectionItem.props.routerOptions);
                        state.close();
                        break;
                    } else if (collectionItem === null || collectionItem === void 0 ? void 0 : collectionItem.props.onAction) {
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
        let blurFromButton = (buttonRef === null || buttonRef === void 0 ? void 0 : buttonRef.current) && buttonRef.current === e.relatedTarget;
        let blurIntoPopover = (0, $d8ac7ed472840322$export$4282f70798064fe0)(popoverRef.current, e.relatedTarget);
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
    let valueId = $61b9b89d5634b83f$var$useValueId([
        state.selectionManager.selectedKeys,
        state.selectionManager.selectionMode
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $032ede929f47bd98$export$712718f7aec83d5)({
        ...props,
        // In multi-select mode, only set required if the selection is empty.
        isRequired: props.selectionMode === 'multiple' ? props.isRequired && state.selectionManager.isEmpty : props.isRequired,
        onChange: state.setInputValue,
        onKeyDown: !isReadOnly ? (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown) : props.onKeyDown,
        onBlur: onBlur,
        value: state.inputValue,
        defaultValue: state.defaultInputValue,
        onFocus: onFocus,
        autoComplete: 'off',
        validate: undefined,
        [(0, $6EqVl$privateValidationStateProp)]: state,
        'aria-describedby': [
            valueId,
            props['aria-describedby']
        ].filter(Boolean).join(' ') || undefined
    }, inputRef);
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(inputRef, state.defaultValue, state.setValue);
    // Press handlers for the ComboBox button
    let onPress = (e)=>{
        if (e.pointerType === 'touch') {
            var // Focus the input field in case it isn't focused yet
            _inputRef_current;
            (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.focus();
            state.toggle(null, 'manual');
        }
    };
    let onPressStart = (e)=>{
        if (e.pointerType !== 'touch') {
            var _inputRef_current;
            (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.focus();
            state.toggle(e.pointerType === 'keyboard' || e.pointerType === 'virtual' ? 'first' : null, 'manual');
        }
    };
    let triggerLabelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        id: menuTriggerProps.id,
        'aria-label': stringFormatter.format('buttonLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    let listBoxProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        id: menuProps.id,
        'aria-label': stringFormatter.format('listboxLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
    let lastEventTime = (0, $6EqVl$useRef)(0);
    let onTouchEnd = (e)=>{
        if (isDisabled || isReadOnly) return;
        // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
        if (e.timeStamp - lastEventTime.current < 500) {
            var _inputRef_current;
            e.preventDefault();
            (_inputRef_current = inputRef.current) === null || _inputRef_current === void 0 ? void 0 : _inputRef_current.focus();
            return;
        }
        let rect = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).getBoundingClientRect();
        let touch = e.changedTouches[0];
        let centerX = Math.ceil(rect.left + 0.5 * rect.width);
        let centerY = Math.ceil(rect.top + 0.5 * rect.height);
        if (touch.clientX === centerX && touch.clientY === centerY) {
            var _inputRef_current1;
            e.preventDefault();
            (_inputRef_current1 = inputRef.current) === null || _inputRef_current1 === void 0 ? void 0 : _inputRef_current1.focus();
            state.toggle(null, 'manual');
            lastEventTime.current = e.timeStamp;
        }
    };
    // VoiceOver has issues with announcing aria-activedescendant properly on change
    // (especially on iOS). We use a live region announcer to announce focus changes
    // manually. In addition, section titles are announced when navigating into a new section.
    let focusedItem = state.selectionManager.focusedKey != null && state.isOpen ? state.collection.getItem(state.selectionManager.focusedKey) : undefined;
    var _focusedItem_parentKey;
    let sectionKey = (_focusedItem_parentKey = focusedItem === null || focusedItem === void 0 ? void 0 : focusedItem.parentKey) !== null && _focusedItem_parentKey !== void 0 ? _focusedItem_parentKey : null;
    var _state_selectionManager_focusedKey;
    let itemKey = (_state_selectionManager_focusedKey = state.selectionManager.focusedKey) !== null && _state_selectionManager_focusedKey !== void 0 ? _state_selectionManager_focusedKey : null;
    let lastSection = (0, $6EqVl$useRef)(sectionKey);
    let lastItem = (0, $6EqVl$useRef)(itemKey);
    (0, $6EqVl$useEffect)(()=>{
        if ((0, $d5a2be505488529f$export$e1865c3bedcd822b)() && focusedItem != null && itemKey != null && itemKey !== lastItem.current) {
            let isSelected = state.selectionManager.isSelected(itemKey);
            let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
            let sectionTitle = (section === null || section === void 0 ? void 0 : section['aria-label']) || (typeof (section === null || section === void 0 ? void 0 : section.rendered) === 'string' ? section.rendered : '') || '';
            var _ref;
            let announcement = stringFormatter.format('focusAnnouncement', {
                isGroupChange: (_ref = section && sectionKey !== lastSection.current) !== null && _ref !== void 0 ? _ref : false,
                groupTitle: sectionTitle,
                groupCount: section ? [
                    ...(0, $6EqVl$getChildNodes)(section, state.collection)
                ].length : 0,
                optionText: focusedItem['aria-label'] || focusedItem.textValue || '',
                isSelected: isSelected
            });
            (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSection.current = sectionKey;
        lastItem.current = itemKey;
    });
    // Announce the number of available suggestions when it changes
    let optionCount = (0, $6EqVl$getItemCount)(state.collection);
    let lastSize = (0, $6EqVl$useRef)(optionCount);
    let lastOpen = (0, $6EqVl$useRef)(state.isOpen);
    (0, $6EqVl$useEffect)(()=>{
        // Only announce the number of options available when the menu opens if there is no
        // focused item, otherwise screen readers will typically read e.g. "1 of 6".
        // The exception is VoiceOver since this isn't included in the message above.
        let didOpenWithoutFocusedItem = state.isOpen !== lastOpen.current && (state.selectionManager.focusedKey == null || (0, $d5a2be505488529f$export$e1865c3bedcd822b)());
        if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
            let announcement = stringFormatter.format('countAnnouncement', {
                optionCount: optionCount
            });
            (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSize.current = optionCount;
        lastOpen.current = state.isOpen;
    });
    // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
    // TODO: do we need to do this for multi-select?
    let lastSelectedKey = (0, $6EqVl$useRef)(state.selectedKey);
    (0, $6EqVl$useEffect)(()=>{
        if ((0, $d5a2be505488529f$export$e1865c3bedcd822b)() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
            let optionText = state.selectedItem['aria-label'] || state.selectedItem.textValue || '';
            let announcement = stringFormatter.format('selectedAnnouncement', {
                optionText: optionText
            });
            (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(announcement);
        }
        lastSelectedKey.current = state.selectedKey;
    });
    (0, $6EqVl$useEffect)(()=>{
        if (state.isOpen) return (0, $20aa6983aa303ce6$export$1c3ebcada18427bf)([
            inputRef.current,
            popoverRef.current
        ].filter((element)=>element != null));
    }, [
        state.isOpen,
        inputRef,
        popoverRef
    ]);
    (0, $b444858e8a82ccea$export$496315a1608d9602)(()=>{
        // Re-show focus ring when there is no virtually focused item.
        if (!focusedItem && inputRef.current && (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)((0, $cc3c3666b64debad$export$b204af158042fbac)(inputRef.current)) === inputRef.current) (0, $57a86975180d30a8$export$2b35b76d2e30e129)(inputRef.current, null);
    }, [
        focusedItem
    ]);
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(listBoxRef, 'react-aria-item-action', state.isOpen ? ()=>{
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
        inputProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(inputProps, {
            role: 'combobox',
            'aria-expanded': menuTriggerProps['aria-expanded'],
            'aria-controls': state.isOpen ? menuProps.id : undefined,
            // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
            'aria-autocomplete': 'list',
            'aria-activedescendant': focusedItem ? (0, $519a33be2aaefa45$export$9145995848b05025)(state, focusedItem.key) : undefined,
            onTouchEnd: onTouchEnd,
            // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
            autoCorrect: 'off',
            // This disable's the macOS Safari spell check auto corrections.
            spellCheck: 'false'
        }),
        listBoxProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(menuProps, listBoxProps, {
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
function $61b9b89d5634b83f$var$useValueId(depArray = []) {
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let [exists, setExists] = (0, $6EqVl$useState)(true);
    let [lastDeps, setLastDeps] = (0, $6EqVl$useState)(depArray);
    // If the deps changed, set exists to true so we can test whether the element exists.
    if (lastDeps.some((v, i)=>!Object.is(v, depArray[i]))) {
        setExists(true);
        setLastDeps(depArray);
    }
    (0, $6EqVl$useEffect)(()=>{
        if (exists && !document.getElementById(id)) // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setExists(false);
    }, [
        id,
        exists,
        lastDeps
    ]);
    return exists ? id : undefined;
}


export {$61b9b89d5634b83f$export$8c18d1b4f7232bbf as useComboBox};
//# sourceMappingURL=useComboBox.js.map
