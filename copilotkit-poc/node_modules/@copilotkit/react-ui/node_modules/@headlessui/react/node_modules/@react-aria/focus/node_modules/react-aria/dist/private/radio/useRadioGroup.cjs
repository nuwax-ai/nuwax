var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $49582955cc364b1c$exports = require("../utils/domHelpers.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $feff03d1687e9827$exports = require("./utils.cjs");
var $e3486d9c44549186$exports = require("../label/useField.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useRadioGroup", function () { return $8dccc06ee8ed53b8$export$62b9571f283ff5c2; });
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









function $8dccc06ee8ed53b8$export$62b9571f283ff5c2(props, state) {
    let { name: name, form: form, isReadOnly: isReadOnly, isRequired: isRequired, isDisabled: isDisabled, orientation: orientation = 'vertical', validationBehavior: validationBehavior = 'aria' } = props;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $e3486d9c44549186$exports.useField)({
        ...props,
        // Radio group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span',
        isInvalid: state.isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props, {
        labelable: true
    });
    // When the radio group loses focus, reset the focusable radio to null if
    // there is no selection. This allows tabbing into the group from either
    // direction to go to the first or last radio.
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        onBlurWithin (e) {
            props.onBlur?.(e);
            if (!state.selectedValue) state.setLastFocusedValue(null);
        },
        onFocusWithin: props.onFocus,
        onFocusWithinChange: props.onFocusChange
    });
    let onKeyDown = (e)=>{
        let nextDir;
        switch(e.key){
            case 'ArrowRight':
                if (direction === 'rtl' && orientation !== 'vertical') nextDir = 'prev';
                else nextDir = 'next';
                break;
            case 'ArrowLeft':
                if (direction === 'rtl' && orientation !== 'vertical') nextDir = 'next';
                else nextDir = 'prev';
                break;
            case 'ArrowDown':
                nextDir = 'next';
                break;
            case 'ArrowUp':
                nextDir = 'prev';
                break;
            default:
                return;
        }
        e.preventDefault();
        let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(e.currentTarget, {
            from: (0, $da02ee888921bc9e$exports.getEventTarget)(e),
            accept: (node)=>node instanceof (0, $49582955cc364b1c$exports.getOwnerWindow)(node).HTMLInputElement && node.type === 'radio'
        });
        let nextElem;
        if (nextDir === 'next') {
            nextElem = walker.nextNode();
            if (!nextElem) {
                walker.currentNode = e.currentTarget;
                nextElem = walker.firstChild();
            }
        } else {
            nextElem = walker.previousNode();
            if (!nextElem) {
                walker.currentNode = e.currentTarget;
                nextElem = walker.lastChild();
            }
        }
        if (nextElem) {
            // Call focus on nextElem so that keyboard navigation scrolls the radio into view
            nextElem.focus();
            state.setSelectedValue(nextElem.value);
        }
    };
    let groupName = (0, $7ac82d1fee77eb8a$exports.useId)(name);
    (0, $feff03d1687e9827$exports.radioGroupData).set(state, {
        name: groupName,
        form: form,
        descriptionId: descriptionProps.id,
        errorMessageId: errorMessageProps.id,
        validationBehavior: validationBehavior
    });
    return {
        radioGroupProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, {
            // https://www.w3.org/TR/wai-aria-1.2/#radiogroup
            role: 'radiogroup',
            onKeyDown: onKeyDown,
            'aria-invalid': state.isInvalid || undefined,
            'aria-errormessage': props['aria-errormessage'],
            'aria-readonly': isReadOnly || undefined,
            'aria-required': isRequired || undefined,
            'aria-disabled': isDisabled || undefined,
            'aria-orientation': orientation,
            ...fieldProps,
            ...focusWithinProps
        }),
        labelProps: labelProps,
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


//# sourceMappingURL=useRadioGroup.cjs.map
