import {chain as $a4e76a5424781910$export$e08e3b67e392101e} from "../utils/chain.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {ListKeyboardDelegate as $ae8f8d98b2b18f2f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {setInteractionModality as $8f5a2122b0992be3$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.mjs";
import {useCollator as $673d46fce3e5717d$export$a16aca283550c30d} from "../i18n/useCollator.mjs";
import {useField as $191c9b6d48a0a4e2$export$294aa081a6c6f55d} from "../label/useField.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useMenuTrigger as $f19b83c1486f45cc$export$dc9c12ed27dd1b49} from "../menu/useMenuTrigger.mjs";
import {useTypeSelect as $f5a4a9a3486154da$export$e32c88dfddc6e1d8} from "../selection/useTypeSelect.mjs";
import {useMemo as $dmsVn$useMemo} from "react";

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











const $c0a45cd074520508$export$703601b7e90536f8 = new WeakMap();
function $c0a45cd074520508$export$e64b2f635402ca43(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isDisabled: isDisabled, isRequired: isRequired, name: name, form: form, validationBehavior: validationBehavior = 'aria' } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $673d46fce3e5717d$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let delegate = (0, $dmsVn$useMemo)(()=>keyboardDelegate || new (0, $ae8f8d98b2b18f2f$export$a05409b8bb224a5a)(state.collection, state.disabledKeys, ref, collator), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        collator,
        ref
    ]);
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $f19b83c1486f45cc$export$dc9c12ed27dd1b49)({
        isDisabled: isDisabled,
        type: 'listbox'
    }, state, ref);
    let onKeyDown = (e)=>{
        if (state.selectionManager.selectionMode === 'multiple') return;
        switch(e.key){
            case 'ArrowLeft':
                {
                    // prevent scrolling containers
                    e.preventDefault();
                    let key = state.selectedKey != null ? delegate.getKeyAbove?.(state.selectedKey) : delegate.getFirstKey?.();
                    if (key != null) state.setSelectedKey(key);
                    break;
                }
            case 'ArrowRight':
                {
                    // prevent scrolling containers
                    e.preventDefault();
                    let key = state.selectedKey != null ? delegate.getKeyBelow?.(state.selectedKey) : delegate.getFirstKey?.();
                    if (key != null) state.setSelectedKey(key);
                    break;
                }
        }
    };
    let { typeSelectProps: typeSelectProps } = (0, $f5a4a9a3486154da$export$e32c88dfddc6e1d8)({
        keyboardDelegate: delegate,
        selectionManager: state.selectionManager,
        onTypeSelect (key) {
            state.setSelectedKey(key);
        }
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $191c9b6d48a0a4e2$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    typeSelectProps.onKeyDown = typeSelectProps.onKeyDownCapture;
    delete typeSelectProps.onKeyDownCapture;
    if (state.selectionManager.selectionMode === 'multiple') typeSelectProps = {};
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let triggerProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(typeSelectProps, menuTriggerProps, fieldProps);
    let valueId = (0, $390e54f620492c70$export$f680877a34711e37)();
    $c0a45cd074520508$export$703601b7e90536f8.set(state, {
        isDisabled: isDisabled,
        isRequired: isRequired,
        name: name,
        form: form,
        validationBehavior: validationBehavior
    });
    return {
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                if (!props.isDisabled) {
                    ref.current?.focus();
                    // Show the focus ring so the user knows where focus went
                    (0, $8f5a2122b0992be3$export$8397ddfc504fdb9a)('keyboard');
                }
            }
        },
        triggerProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, {
            ...triggerProps,
            isDisabled: isDisabled,
            onKeyDown: (0, $a4e76a5424781910$export$e08e3b67e392101e)(triggerProps.onKeyDown, onKeyDown, props.onKeyDown),
            onKeyUp: props.onKeyUp,
            'aria-labelledby': [
                valueId,
                triggerProps['aria-labelledby'],
                triggerProps['aria-label'] && !triggerProps['aria-labelledby'] ? triggerProps.id : null
            ].filter(Boolean).join(' '),
            onFocus (e) {
                if (state.isFocused) return;
                if (props.onFocus) props.onFocus(e);
                if (props.onFocusChange) props.onFocusChange(true);
                state.setFocused(true);
            },
            onBlur (e) {
                if (state.isOpen) return;
                if (props.onBlur) props.onBlur(e);
                if (props.onFocusChange) props.onFocusChange(false);
                state.setFocused(false);
            }
        }),
        valueProps: {
            id: valueId
        },
        menuProps: {
            ...menuProps,
            autoFocus: state.focusStrategy || true,
            shouldSelectOnPressUp: true,
            shouldFocusOnHover: true,
            disallowEmptySelection: true,
            linkBehavior: 'selection',
            onBlur: (e)=>{
                if ((0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget)) return;
                if (props.onBlur) props.onBlur(e);
                if (props.onFocusChange) props.onFocusChange(false);
                state.setFocused(false);
            },
            'aria-labelledby': [
                fieldProps['aria-labelledby'],
                triggerProps['aria-label'] && !fieldProps['aria-labelledby'] ? triggerProps.id : null
            ].filter(Boolean).join(' ')
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails,
        hiddenSelectProps: {
            isDisabled: isDisabled,
            name: name,
            label: props.label,
            state: state,
            triggerRef: ref,
            form: form
        }
    };
}


export {$c0a45cd074520508$export$703601b7e90536f8 as selectData, $c0a45cd074520508$export$e64b2f635402ca43 as useSelect};
//# sourceMappingURL=useSelect.mjs.map
