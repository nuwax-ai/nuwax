import {chain as $2cf8bb4b9e45dc81$export$e08e3b67e392101e} from "../utils/chain.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {ListKeyboardDelegate as $abb04fbee71f000f$export$a05409b8bb224a5a} from "../selection/ListKeyboardDelegate.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {setInteractionModality as $b50b1cc8a843ace7$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.js";
import {useCollator as $14a307baf19f0c4b$export$a16aca283550c30d} from "../i18n/useCollator.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useMenuTrigger as $5b0efffb5b3e0cc9$export$dc9c12ed27dd1b49} from "../menu/useMenuTrigger.js";
import {useTypeSelect as $d6feb9780eea1a71$export$e32c88dfddc6e1d8} from "../selection/useTypeSelect.js";
import {useMemo as $dDDQ1$useMemo} from "react";

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











const $960d44b6aa09c372$export$703601b7e90536f8 = new WeakMap();
function $960d44b6aa09c372$export$e64b2f635402ca43(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isDisabled: isDisabled, isRequired: isRequired, name: name, form: form, validationBehavior: validationBehavior = 'aria' } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $14a307baf19f0c4b$export$a16aca283550c30d)({
        usage: 'search',
        sensitivity: 'base'
    });
    let delegate = (0, $dDDQ1$useMemo)(()=>keyboardDelegate || new (0, $abb04fbee71f000f$export$a05409b8bb224a5a)(state.collection, state.disabledKeys, ref, collator), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        collator,
        ref
    ]);
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $5b0efffb5b3e0cc9$export$dc9c12ed27dd1b49)({
        isDisabled: isDisabled,
        type: 'listbox'
    }, state, ref);
    let onKeyDown = (e)=>{
        if (state.selectionManager.selectionMode === 'multiple') return;
        switch(e.key){
            case 'ArrowLeft':
                {
                    var _delegate_getKeyAbove, _delegate_getFirstKey;
                    // prevent scrolling containers
                    e.preventDefault();
                    let key = state.selectedKey != null ? (_delegate_getKeyAbove = delegate.getKeyAbove) === null || _delegate_getKeyAbove === void 0 ? void 0 : _delegate_getKeyAbove.call(delegate, state.selectedKey) : (_delegate_getFirstKey = delegate.getFirstKey) === null || _delegate_getFirstKey === void 0 ? void 0 : _delegate_getFirstKey.call(delegate);
                    if (key != null) state.setSelectedKey(key);
                    break;
                }
            case 'ArrowRight':
                {
                    var _delegate_getKeyBelow, _delegate_getFirstKey1;
                    // prevent scrolling containers
                    e.preventDefault();
                    let key = state.selectedKey != null ? (_delegate_getKeyBelow = delegate.getKeyBelow) === null || _delegate_getKeyBelow === void 0 ? void 0 : _delegate_getKeyBelow.call(delegate, state.selectedKey) : (_delegate_getFirstKey1 = delegate.getFirstKey) === null || _delegate_getFirstKey1 === void 0 ? void 0 : _delegate_getFirstKey1.call(delegate);
                    if (key != null) state.setSelectedKey(key);
                    break;
                }
        }
    };
    let { typeSelectProps: typeSelectProps } = (0, $d6feb9780eea1a71$export$e32c88dfddc6e1d8)({
        keyboardDelegate: delegate,
        selectionManager: state.selectionManager,
        onTypeSelect (key) {
            state.setSelectedKey(key);
        }
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    typeSelectProps.onKeyDown = typeSelectProps.onKeyDownCapture;
    delete typeSelectProps.onKeyDownCapture;
    if (state.selectionManager.selectionMode === 'multiple') typeSelectProps = {};
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    let triggerProps = (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(typeSelectProps, menuTriggerProps, fieldProps);
    let valueId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    $960d44b6aa09c372$export$703601b7e90536f8.set(state, {
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
                    var _ref_current;
                    (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.focus();
                    // Show the focus ring so the user knows where focus went
                    (0, $b50b1cc8a843ace7$export$8397ddfc504fdb9a)('keyboard');
                }
            }
        },
        triggerProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
            ...triggerProps,
            isDisabled: isDisabled,
            onKeyDown: (0, $2cf8bb4b9e45dc81$export$e08e3b67e392101e)(triggerProps.onKeyDown, onKeyDown, props.onKeyDown),
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
                if ((0, $d8ac7ed472840322$export$4282f70798064fe0)(e.currentTarget, e.relatedTarget)) return;
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


export {$960d44b6aa09c372$export$703601b7e90536f8 as selectData, $960d44b6aa09c372$export$e64b2f635402ca43 as useSelect};
//# sourceMappingURL=useSelect.js.map
