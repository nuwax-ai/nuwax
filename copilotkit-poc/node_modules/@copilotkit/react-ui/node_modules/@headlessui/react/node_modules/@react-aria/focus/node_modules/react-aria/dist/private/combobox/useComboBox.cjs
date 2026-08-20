var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $3c73045d61be2d91$exports = require("../overlays/ariaHideOutside.cjs");
var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $4f541c01c875ab4e$exports = require("../focus/virtualFocus.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $63bd36c8d873711d$exports = require("../listbox/utils.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $360aeef44cc3a14a$exports = require("./intlStrings.cjs");
var $d0b4a781cf26e80b$exports = require("../utils/platform.cjs");
var $22ef0686d6af4fda$exports = require("../selection/ListKeyboardDelegate.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $6e76e65001bbcda2$exports = require("../utils/useEvent.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $5b639fe010c6782f$exports = require("../menu/useMenuTrigger.cjs");
var $75bd88aab025820b$exports = require("../utils/openLink.cjs");
var $df9ba3e9a7210056$exports = require("../selection/useSelectableCollection.cjs");
var $262100337fa41653$exports = require("../textfield/useTextField.cjs");
var $c4703f4a6fffa1e7$exports = require("../utils/useUpdateEffect.cjs");
var $h58K2$react = require("react");
var $h58K2$reactstatelyprivatecollectionsgetChildNodes = require("react-stately/private/collections/getChildNodes");
var $h58K2$reactstatelyprivatecollectionsgetItemCount = require("react-stately/private/collections/getItemCount");
var $h58K2$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useComboBox", function () { return $9f4ec1506bb7618d$export$8c18d1b4f7232bbf; });
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
























function $9f4ec1506bb7618d$export$8c18d1b4f7232bbf(props, state) {
    let { buttonRef: buttonRef, popoverRef: popoverRef, inputRef: inputRef, listBoxRef: listBoxRef, keyboardDelegate: keyboardDelegate, layoutDelegate: layoutDelegate, shouldFocusWrap: // completionMode = 'suggest',
    shouldFocusWrap, isReadOnly: isReadOnly, isDisabled: isDisabled } = props;
    let backupBtnRef = (0, $h58K2$react.useRef)(null);
    buttonRef = buttonRef ?? backupBtnRef;
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($360aeef44cc3a14a$exports))), '@react-aria/combobox');
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $5b639fe010c6782f$exports.useMenuTrigger)({
        type: 'listbox',
        isDisabled: isDisabled || isReadOnly
    }, state, buttonRef);
    // Set listbox id so it can be used when calling getItemId later
    (0, $63bd36c8d873711d$exports.listData).set(state, {
        id: menuProps.id
    });
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let { collection: collection } = state;
    let { disabledKeys: disabledKeys } = state.selectionManager;
    let delegate = (0, $h58K2$react.useMemo)(()=>keyboardDelegate || new (0, $22ef0686d6af4fda$exports.ListKeyboardDelegate)({
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
    let { collectionProps: collectionProps } = (0, $df9ba3e9a7210056$exports.useSelectableCollection)({
        selectionManager: state.selectionManager,
        keyboardDelegate: delegate,
        disallowTypeAhead: true,
        disallowEmptySelection: true,
        shouldFocusWrap: shouldFocusWrap,
        ref: inputRef,
        // Prevent item scroll behavior from being applied here, should be handled in the user's Popover + ListBox component
        isVirtualized: true
    });
    let router = (0, $75bd88aab025820b$exports.useRouter)();
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
        let blurIntoPopover = (0, $da02ee888921bc9e$exports.nodeContains)(popoverRef.current, e.relatedTarget);
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
    let valueId = $9f4ec1506bb7618d$var$useValueId([
        state.selectionManager.selectedKeys,
        state.selectionManager.selectionMode
    ]);
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, inputProps: inputProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $262100337fa41653$exports.useTextField)({
        ...props,
        // In multi-select mode, only set required if the selection is empty.
        isRequired: props.selectionMode === 'multiple' ? props.isRequired && state.selectionManager.isEmpty : props.isRequired,
        onChange: state.setInputValue,
        onKeyDown: !isReadOnly ? (0, $2f95486cfdaa743c$exports.chain)(state.isOpen && collectionProps.onKeyDown, onKeyDown, props.onKeyDown) : props.onKeyDown,
        onBlur: onBlur,
        value: state.inputValue,
        defaultValue: state.defaultInputValue,
        onFocus: onFocus,
        autoComplete: 'off',
        validate: undefined,
        [(0, $h58K2$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: state,
        'aria-describedby': [
            valueId,
            props['aria-describedby']
        ].filter(Boolean).join(' ') || undefined
    }, inputRef);
    (0, $bbab3903416f8d01$exports.useFormReset)(inputRef, state.defaultValue, state.setValue);
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
    let triggerLabelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        id: menuTriggerProps.id,
        'aria-label': stringFormatter.format('buttonLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    let listBoxProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        id: menuProps.id,
        'aria-label': stringFormatter.format('listboxLabel'),
        'aria-labelledby': props['aria-labelledby'] || labelProps.id
    });
    // If a touch happens on direct center of ComboBox input, might be virtual click from iPad so open ComboBox menu
    let lastEventTime = (0, $h58K2$react.useRef)(0);
    let onTouchEnd = (e)=>{
        if (isDisabled || isReadOnly) return;
        // Sometimes VoiceOver on iOS fires two touchend events in quick succession. Ignore the second one.
        if (e.timeStamp - lastEventTime.current < 500) {
            e.preventDefault();
            inputRef.current?.focus();
            return;
        }
        let rect = (0, $da02ee888921bc9e$exports.getEventTarget)(e).getBoundingClientRect();
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
    let lastSection = (0, $h58K2$react.useRef)(sectionKey);
    let lastItem = (0, $h58K2$react.useRef)(itemKey);
    (0, $h58K2$react.useEffect)(()=>{
        if ((0, $d0b4a781cf26e80b$exports.isAppleDevice)() && focusedItem != null && itemKey != null && itemKey !== lastItem.current) {
            let isSelected = state.selectionManager.isSelected(itemKey);
            let section = sectionKey != null ? state.collection.getItem(sectionKey) : null;
            let sectionTitle = section?.['aria-label'] || (typeof section?.rendered === 'string' ? section.rendered : '') || '';
            let announcement = stringFormatter.format('focusAnnouncement', {
                isGroupChange: (section && sectionKey !== lastSection.current) ?? false,
                groupTitle: sectionTitle,
                groupCount: section ? [
                    ...(0, $h58K2$reactstatelyprivatecollectionsgetChildNodes.getChildNodes)(section, state.collection)
                ].length : 0,
                optionText: focusedItem['aria-label'] || focusedItem.textValue || '',
                isSelected: isSelected
            });
            (0, $74b2c5b1e7ea9589$exports.announce)(announcement);
        }
        lastSection.current = sectionKey;
        lastItem.current = itemKey;
    });
    // Announce the number of available suggestions when it changes
    let optionCount = (0, $h58K2$reactstatelyprivatecollectionsgetItemCount.getItemCount)(state.collection);
    let lastSize = (0, $h58K2$react.useRef)(optionCount);
    let lastOpen = (0, $h58K2$react.useRef)(state.isOpen);
    (0, $h58K2$react.useEffect)(()=>{
        // Only announce the number of options available when the menu opens if there is no
        // focused item, otherwise screen readers will typically read e.g. "1 of 6".
        // The exception is VoiceOver since this isn't included in the message above.
        let didOpenWithoutFocusedItem = state.isOpen !== lastOpen.current && (state.selectionManager.focusedKey == null || (0, $d0b4a781cf26e80b$exports.isAppleDevice)());
        if (state.isOpen && (didOpenWithoutFocusedItem || optionCount !== lastSize.current)) {
            let announcement = stringFormatter.format('countAnnouncement', {
                optionCount: optionCount
            });
            (0, $74b2c5b1e7ea9589$exports.announce)(announcement);
        }
        lastSize.current = optionCount;
        lastOpen.current = state.isOpen;
    });
    // Announce when a selection occurs for VoiceOver. Other screen readers typically do this automatically.
    // TODO: do we need to do this for multi-select?
    let lastSelectedKey = (0, $h58K2$react.useRef)(state.selectedKey);
    (0, $h58K2$react.useEffect)(()=>{
        if ((0, $d0b4a781cf26e80b$exports.isAppleDevice)() && state.isFocused && state.selectedItem && state.selectedKey !== lastSelectedKey.current) {
            let optionText = state.selectedItem['aria-label'] || state.selectedItem.textValue || '';
            let announcement = stringFormatter.format('selectedAnnouncement', {
                optionText: optionText
            });
            (0, $74b2c5b1e7ea9589$exports.announce)(announcement);
        }
        lastSelectedKey.current = state.selectedKey;
    });
    (0, $h58K2$react.useEffect)(()=>{
        if (state.isOpen) return (0, $3c73045d61be2d91$exports.ariaHideOutside)([
            inputRef.current,
            popoverRef.current
        ].filter((element)=>element != null));
    }, [
        state.isOpen,
        inputRef,
        popoverRef
    ]);
    (0, $c4703f4a6fffa1e7$exports.useUpdateEffect)(()=>{
        // Re-show focus ring when there is no virtually focused item.
        if (!focusedItem && inputRef.current && (0, $da02ee888921bc9e$exports.getActiveElement)((0, $49582955cc364b1c$exports.getOwnerDocument)(inputRef.current)) === inputRef.current) (0, $4f541c01c875ab4e$exports.dispatchVirtualFocus)(inputRef.current, null);
    }, [
        focusedItem
    ]);
    (0, $6e76e65001bbcda2$exports.useEvent)(listBoxRef, 'react-aria-item-action', state.isOpen ? ()=>{
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
        inputProps: (0, $89b39774f3b79dbb$exports.mergeProps)(inputProps, {
            role: 'combobox',
            'aria-expanded': menuTriggerProps['aria-expanded'],
            'aria-controls': state.isOpen ? menuProps.id : undefined,
            // TODO: readd proper logic for completionMode = complete (aria-autocomplete: both)
            'aria-autocomplete': 'list',
            'aria-activedescendant': focusedItem ? (0, $63bd36c8d873711d$exports.getItemId)(state, focusedItem.key) : undefined,
            onTouchEnd: onTouchEnd,
            // This disable's iOS's autocorrect suggestions, since the combo box provides its own suggestions.
            autoCorrect: 'off',
            // This disable's the macOS Safari spell check auto corrections.
            spellCheck: 'false'
        }),
        listBoxProps: (0, $89b39774f3b79dbb$exports.mergeProps)(menuProps, listBoxProps, {
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
function $9f4ec1506bb7618d$var$useValueId(depArray = []) {
    let id = (0, $7ac82d1fee77eb8a$exports.useId)();
    let [exists, setExists] = (0, $h58K2$react.useState)(true);
    let [lastDeps, setLastDeps] = (0, $h58K2$react.useState)(depArray);
    // If the deps changed, set exists to true so we can test whether the element exists.
    if (lastDeps.some((v, i)=>!Object.is(v, depArray[i]))) {
        setExists(true);
        setLastDeps(depArray);
    }
    (0, $h58K2$react.useEffect)(()=>{
        if (exists && !document.getElementById(id)) // oxlint-disable-next-line react-hooks-js/set-state-in-effect
        setExists(false);
    }, [
        id,
        exists,
        lastDeps
    ]);
    return exists ? id : undefined;
}


//# sourceMappingURL=useComboBox.cjs.map
