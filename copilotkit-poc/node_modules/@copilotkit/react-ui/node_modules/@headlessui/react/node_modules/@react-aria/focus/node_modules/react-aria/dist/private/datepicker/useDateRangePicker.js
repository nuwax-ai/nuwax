import {createFocusManager as $903814aeb7d53b38$export$c5251b9e124bf29} from "../focus/FocusScope.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {focusManagerSymbol as $5e49eec2a9af6334$export$7b3062cd49e80452, roleSymbol as $5e49eec2a9af6334$export$300019f83c56d282} from "./useDateField.js";
import $6x2Z1$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {useDatePickerGroup as $69ed6c8aabd1db26$export$4a931266a3838b86} from "./useDatePickerGroup.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useField as $b5d79d79d9c34c91$export$294aa081a6c6f55d} from "../label/useField.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {DEFAULT_VALIDATION_RESULT as $6x2Z1$DEFAULT_VALIDATION_RESULT, privateValidationStateProp as $6x2Z1$privateValidationStateProp, mergeValidation as $6x2Z1$mergeValidation} from "react-stately/private/form/useFormValidationState";
import {useMemo as $6x2Z1$useMemo, useRef as $6x2Z1$useRef} from "react";


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














function $4e5549511f609000$export$12fd5f0e9f4bb192(props, state, ref) {
    var _state_value, _state_defaultValue, _state_value1, _state_defaultValue1, _state_dateRange;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($6x2Z1$intlStringsjs))), '@react-aria/datepicker');
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $b5d79d79d9c34c91$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let labelledBy = fieldProps['aria-labelledby'] || fieldProps.id;
    let { locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let range = state.formatValue(locale, {
        month: 'long'
    });
    let description = range ? stringFormatter.format('selectedRangeDescription', {
        startDate: range.start,
        endDate: range.end
    }) : '';
    let descProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    let startFieldProps = {
        'aria-label': stringFormatter.format('startDate'),
        'aria-labelledby': labelledBy
    };
    let endFieldProps = {
        'aria-label': stringFormatter.format('endDate'),
        'aria-labelledby': labelledBy
    };
    let buttonId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let dialogId = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let groupProps = (0, $69ed6c8aabd1db26$export$4a931266a3838b86)(state, ref);
    let ariaDescribedBy = [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let focusManager = (0, $6x2Z1$useMemo)(()=>(0, $903814aeb7d53b38$export$c5251b9e124bf29)(ref, {
            // Exclude the button from the focus manager.
            accept: (element)=>element.id !== buttonId
        }), [
        ref,
        buttonId
    ]);
    let commonFieldProps = {
        [(0, $5e49eec2a9af6334$export$7b3062cd49e80452)]: focusManager,
        [(0, $5e49eec2a9af6334$export$300019f83c56d282)]: 'presentation',
        'aria-describedby': ariaDescribedBy,
        placeholderValue: props.placeholderValue,
        hideTimeZone: props.hideTimeZone,
        hourCycle: props.hourCycle,
        granularity: props.granularity,
        shouldForceLeadingZeros: props.shouldForceLeadingZeros,
        isDisabled: props.isDisabled,
        isReadOnly: props.isReadOnly,
        isRequired: props.isRequired,
        validationBehavior: props.validationBehavior
    };
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    let isFocused = (0, $6x2Z1$useRef)(false);
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
    let startFieldValidation = (0, $6x2Z1$useRef)((0, $6x2Z1$DEFAULT_VALIDATION_RESULT));
    let endFieldValidation = (0, $6x2Z1$useRef)((0, $6x2Z1$DEFAULT_VALIDATION_RESULT));
    var _state_value_start, _state_value_end;
    return {
        groupProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
            role: 'group',
            'aria-disabled': props.isDisabled || null,
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
        startFieldProps: {
            ...startFieldProps,
            ...commonFieldProps,
            value: (_state_value_start = (_state_value = state.value) === null || _state_value === void 0 ? void 0 : _state_value.start) !== null && _state_value_start !== void 0 ? _state_value_start : null,
            defaultValue: (_state_defaultValue = state.defaultValue) === null || _state_defaultValue === void 0 ? void 0 : _state_defaultValue.start,
            onChange: (start)=>state.setDateTime('start', start),
            autoFocus: props.autoFocus,
            name: props.startName,
            form: props.form,
            [(0, $6x2Z1$privateValidationStateProp)]: {
                realtimeValidation: state.realtimeValidation,
                displayValidation: state.displayValidation,
                updateValidation (e) {
                    startFieldValidation.current = e;
                    state.updateValidation((0, $6x2Z1$mergeValidation)(e, endFieldValidation.current));
                },
                resetValidation: state.resetValidation,
                commitValidation: state.commitValidation
            }
        },
        endFieldProps: {
            ...endFieldProps,
            ...commonFieldProps,
            value: (_state_value_end = (_state_value1 = state.value) === null || _state_value1 === void 0 ? void 0 : _state_value1.end) !== null && _state_value_end !== void 0 ? _state_value_end : null,
            defaultValue: (_state_defaultValue1 = state.defaultValue) === null || _state_defaultValue1 === void 0 ? void 0 : _state_defaultValue1.end,
            onChange: (end)=>state.setDateTime('end', end),
            name: props.endName,
            form: props.form,
            [(0, $6x2Z1$privateValidationStateProp)]: {
                realtimeValidation: state.realtimeValidation,
                displayValidation: state.displayValidation,
                updateValidation (e) {
                    endFieldValidation.current = e;
                    state.updateValidation((0, $6x2Z1$mergeValidation)(startFieldValidation.current, e));
                },
                resetValidation: state.resetValidation,
                commitValidation: state.commitValidation
            }
        },
        descriptionProps: descriptionProps,
        errorMessageProps: errorMessageProps,
        calendarProps: {
            autoFocus: true,
            value: ((_state_dateRange = state.dateRange) === null || _state_dateRange === void 0 ? void 0 : _state_dateRange.start) && state.dateRange.end ? state.dateRange : null,
            onChange: state.setDateRange,
            minValue: props.minValue,
            maxValue: props.maxValue,
            isDisabled: props.isDisabled,
            isReadOnly: props.isReadOnly,
            isDateUnavailable: props.isDateUnavailable,
            allowsNonContiguousRanges: props.allowsNonContiguousRanges,
            defaultFocusedValue: state.dateRange ? undefined : props.placeholderValue,
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


export {$4e5549511f609000$export$12fd5f0e9f4bb192 as useDateRangePicker};
//# sourceMappingURL=useDateRangePicker.js.map
