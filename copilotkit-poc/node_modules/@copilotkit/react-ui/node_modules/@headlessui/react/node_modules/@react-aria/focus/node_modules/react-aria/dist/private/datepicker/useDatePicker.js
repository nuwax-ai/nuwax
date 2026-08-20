import {createFocusManager as $903814aeb7d53b38$export$c5251b9e124bf29} from "../focus/FocusScope.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import $6wRHU$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {roleSymbol as $5e49eec2a9af6334$export$300019f83c56d282} from "./useDateField.js";
import {useDatePickerGroup as $69ed6c8aabd1db26$export$4a931266a3838b86} from "./useDatePickerGroup.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {privateValidationStateProp as $6wRHU$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";
import {useMemo as $6wRHU$useMemo, useRef as $6wRHU$useRef} from "react";


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














function $c39ca12fb747c731$export$42df105a73306d51(props, state, ref) {
    let buttonId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let dialogId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let fieldId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($6wRHU$intlStringsjs))), '@react-aria/datepicker');
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let groupProps = (0, $69ed6c8aabd1db26$export$4a931266a3838b86)(state, ref);
    let labelledBy = fieldProps['aria-labelledby'] || fieldProps.id;
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let date = state.formatValue(locale, {
        month: 'long'
    });
    let description = date ? stringFormatter.format('selectedDateDescription', {
        date: date
    }) : '';
    let descProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    let ariaDescribedBy = [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    let focusManager = (0, $6wRHU$useMemo)(()=>(0, $903814aeb7d53b38$export$c5251b9e124bf29)(ref), [
        ref
    ]);
    let isFocused = (0, $6wRHU$useRef)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        ...props,
        isDisabled: state.isOpen,
        onBlurWithin: (e)=>{
            // Ignore when focus moves into the popover.
            let dialog = document.getElementById(dialogId);
            if (!(0, $d8ac7ed472840322$export$4282f70798064fe0)(dialog, e.relatedTarget)) {
                var _props_onBlur, _props_onFocusChange;
                isFocused.current = false;
                (_props_onBlur = props.onBlur) === null || _props_onBlur === void 0 ? void 0 : _props_onBlur.call(props, e);
                (_props_onFocusChange = props.onFocusChange) === null || _props_onFocusChange === void 0 ? void 0 : _props_onFocusChange.call(props, false);
            }
        },
        onFocusWithin: (e)=>{
            if (!isFocused.current) {
                var _props_onFocus, _props_onFocusChange;
                isFocused.current = true;
                (_props_onFocus = props.onFocus) === null || _props_onFocus === void 0 ? void 0 : _props_onFocus.call(props, e);
                (_props_onFocusChange = props.onFocusChange) === null || _props_onFocusChange === void 0 ? void 0 : _props_onFocusChange.call(props, true);
            }
        }
    });
    return {
        groupProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
            role: 'group',
            'aria-disabled': props.isDisabled || null,
            'aria-labelledby': labelledBy,
            'aria-describedby': ariaDescribedBy,
            onKeyDown (e) {
                if (state.isOpen) return;
                if (props.onKeyDown) props.onKeyDown(e);
            },
            onKeyUp (e) {
                if (state.isOpen) return;
                if (props.onKeyUp) props.onKeyUp(e);
            }
        }),
        labelProps: {
            ...labelProps,
            onClick: ()=>{
                focusManager.focusFirst();
            }
        },
        fieldProps: {
            ...fieldProps,
            id: fieldId,
            [(0, $5e49eec2a9af6334$export$300019f83c56d282)]: 'presentation',
            'aria-describedby': ariaDescribedBy,
            value: state.value,
            defaultValue: state.defaultValue,
            onChange: state.setValue,
            placeholderValue: props.placeholderValue,
            hideTimeZone: props.hideTimeZone,
            hourCycle: props.hourCycle,
            shouldForceLeadingZeros: props.shouldForceLeadingZeros,
            granularity: props.granularity,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isRequired: props.isRequired,
            validationBehavior: props.validationBehavior,
            // DatePicker owns the validation state for the date field.
            [(0, $6wRHU$privateValidationStateProp)]: state,
            autoFocus: props.autoFocus,
            name: props.name,
            form: props.form
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        buttonProps: {
            ...descProps,
            id: buttonId,
            'aria-haspopup': 'dialog',
            'aria-label': stringFormatter.format('calendar'),
            'aria-labelledby': `${buttonId} ${labelledBy}`,
            'aria-describedby': ariaDescribedBy,
            'aria-expanded': state.isOpen,
            isDisabled: props.isDisabled || props.isReadOnly,
            onPress: ()=>state.setOpen(true)
        },
        dialogProps: {
            id: dialogId,
            'aria-labelledby': `${buttonId} ${labelledBy}`
        },
        calendarProps: {
            autoFocus: true,
            value: state.dateValue,
            onChange: state.setDateValue,
            minValue: props.minValue,
            maxValue: props.maxValue,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isDateUnavailable: props.isDateUnavailable,
            defaultFocusedValue: state.dateValue ? undefined : props.placeholderValue,
            isInvalid: state.isInvalid,
            errorMessage: typeof props.errorMessage === 'function' ? props.errorMessage(state.displayValidation) : props.errorMessage || state.displayValidation.validationErrors.join(' '),
            firstDayOfWeek: props.firstDayOfWeek,
            pageBehavior: props.pageBehavior
        },
        isInvalid: isInvalid,
        validationErrors: validationErrors,
        validationDetails: validationDetails
    };
}


export {$c39ca12fb747c731$export$42df105a73306d51 as useDatePicker};
//# sourceMappingURL=useDatePicker.js.map
