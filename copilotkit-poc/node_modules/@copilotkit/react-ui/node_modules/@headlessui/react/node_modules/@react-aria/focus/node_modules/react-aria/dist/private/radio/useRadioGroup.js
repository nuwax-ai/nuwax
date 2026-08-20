import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getFocusableTreeWalker as $903814aeb7d53b38$export$2d6ec8fc375ceafa} from "../focus/FocusScope.js";
import {getOwnerWindow as $cc3c3666b64debad$export$f21a1ffae260145a} from "../utils/domHelpers.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {radioGroupData as $171f888ae793e114$export$37b65e5b5444d35c} from "./utils.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";

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









function $69cce56783a62dd9$export$62b9571f283ff5c2(props, state) {
    let { name: name, form: form, isReadOnly: isReadOnly, isRequired: isRequired, isDisabled: isDisabled, orientation: orientation = 'vertical', validationBehavior: validationBehavior = 'aria' } = props;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        // Radio group is not an HTML input element so it
        // shouldn't be labeled by a <label> element.
        labelElementType: 'span',
        isInvalid: state.isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props, {
        labelable: true
    });
    // When the radio group loses focus, reset the focusable radio to null if
    // there is no selection. This allows tabbing into the group from either
    // direction to go to the first or last radio.
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        onBlurWithin (e) {
            var _props_onBlur;
            (_props_onBlur = props.onBlur) === null || _props_onBlur === void 0 ? void 0 : _props_onBlur.call(props, e);
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
        let walker = (0, $903814aeb7d53b38$export$2d6ec8fc375ceafa)(e.currentTarget, {
            from: (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e),
            accept: (node)=>node instanceof (0, $cc3c3666b64debad$export$f21a1ffae260145a)(node).HTMLInputElement && node.type === 'radio'
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
    let groupName = (0, $0292efe68908de6b$export$f680877a34711e37)(name);
    (0, $171f888ae793e114$export$37b65e5b5444d35c).set(state, {
        name: groupName,
        form: form,
        descriptionId: descriptionProps.id,
        errorMessageId: errorMessageProps.id,
        validationBehavior: validationBehavior
    });
    return {
        radioGroupProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, {
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


export {$69cce56783a62dd9$export$62b9571f283ff5c2 as useRadioGroup};
//# sourceMappingURL=useRadioGroup.js.map
