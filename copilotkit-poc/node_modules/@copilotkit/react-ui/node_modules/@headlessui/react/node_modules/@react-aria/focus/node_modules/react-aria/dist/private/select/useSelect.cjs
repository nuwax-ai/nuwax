var $2f95486cfdaa743c$exports = require("../utils/chain.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $22ef0686d6af4fda$exports = require("../selection/ListKeyboardDelegate.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $74751389dd0da9fc$exports = require("../i18n/useCollator.cjs");
var $e3486d9c44549186$exports = require("../label/useField.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $5b639fe010c6782f$exports = require("../menu/useMenuTrigger.cjs");
var $a6299e8d95fc8908$exports = require("../selection/useTypeSelect.cjs");
var $iVReG$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "selectData", function () { return $60b1d3323c1be9a0$export$703601b7e90536f8; });
$parcel$export(module.exports, "useSelect", function () { return $60b1d3323c1be9a0$export$e64b2f635402ca43; });
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











const $60b1d3323c1be9a0$export$703601b7e90536f8 = new WeakMap();
function $60b1d3323c1be9a0$export$e64b2f635402ca43(props, state, ref) {
    let { keyboardDelegate: keyboardDelegate, isDisabled: isDisabled, isRequired: isRequired, name: name, form: form, validationBehavior: validationBehavior = 'aria' } = props;
    // By default, a KeyboardDelegate is provided which uses the DOM to query layout information (e.g. for page up/page down).
    // When virtualized, the layout object will be passed in as a prop and override this.
    let collator = (0, $74751389dd0da9fc$exports.useCollator)({
        usage: 'search',
        sensitivity: 'base'
    });
    let delegate = (0, $iVReG$react.useMemo)(()=>keyboardDelegate || new (0, $22ef0686d6af4fda$exports.ListKeyboardDelegate)(state.collection, state.disabledKeys, ref, collator), [
        keyboardDelegate,
        state.collection,
        state.disabledKeys,
        collator,
        ref
    ]);
    let { menuTriggerProps: menuTriggerProps, menuProps: menuProps } = (0, $5b639fe010c6782f$exports.useMenuTrigger)({
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
    let { typeSelectProps: typeSelectProps } = (0, $a6299e8d95fc8908$exports.useTypeSelect)({
        keyboardDelegate: delegate,
        selectionManager: state.selectionManager,
        onTypeSelect (key) {
            state.setSelectedKey(key);
        }
    });
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $e3486d9c44549186$exports.useField)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    typeSelectProps.onKeyDown = typeSelectProps.onKeyDownCapture;
    delete typeSelectProps.onKeyDownCapture;
    if (state.selectionManager.selectionMode === 'multiple') typeSelectProps = {};
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    let triggerProps = (0, $89b39774f3b79dbb$exports.mergeProps)(typeSelectProps, menuTriggerProps, fieldProps);
    let valueId = (0, $7ac82d1fee77eb8a$exports.useId)();
    $60b1d3323c1be9a0$export$703601b7e90536f8.set(state, {
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
                    (0, $d0df89f3abe2c2ca$exports.setInteractionModality)('keyboard');
                }
            }
        },
        triggerProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
            ...triggerProps,
            isDisabled: isDisabled,
            onKeyDown: (0, $2f95486cfdaa743c$exports.chain)(triggerProps.onKeyDown, onKeyDown, props.onKeyDown),
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
                if ((0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, e.relatedTarget)) return;
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


//# sourceMappingURL=useSelect.cjs.map
