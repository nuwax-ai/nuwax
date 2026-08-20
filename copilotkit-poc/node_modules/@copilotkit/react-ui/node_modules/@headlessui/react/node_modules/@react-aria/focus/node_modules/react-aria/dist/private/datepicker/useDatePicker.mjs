import {createFocusManager as $535772f9d2c1f38d$export$c5251b9e124bf29} from "../focus/FocusScope.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import $41Ubl$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {roleSymbol as $7541913c0284d84b$export$300019f83c56d282} from "./useDateField.mjs";
import {useDatePickerGroup as $6a440d0e2d99dd46$export$4a931266a3838b86} from "./useDatePickerGroup.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useField as $191c9b6d48a0a4e2$export$294aa081a6c6f55d} from "../label/useField.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {privateValidationStateProp as $41Ubl$privateValidationStateProp} from "react-stately/private/form/useFormValidationState";
import {useMemo as $41Ubl$useMemo, useRef as $41Ubl$useRef} from "react";


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














function $6902a2bb26917a07$export$42df105a73306d51(props, state, ref) {
    let buttonId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let dialogId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let fieldId = (0, $390e54f620492c70$export$f680877a34711e37)();
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($41Ubl$intlStringsmjs))), '@react-aria/datepicker');
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $191c9b6d48a0a4e2$export$294aa081a6c6f55d)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let groupProps = (0, $6a440d0e2d99dd46$export$4a931266a3838b86)(state, ref);
    let labelledBy = fieldProps['aria-labelledby'] || fieldProps.id;
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let date = state.formatValue(locale, {
        month: 'long'
    });
    let description = date ? stringFormatter.format('selectedDateDescription', {
        date: date
    }) : '';
    let descProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(description);
    let ariaDescribedBy = [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props);
    let focusManager = (0, $41Ubl$useMemo)(()=>(0, $535772f9d2c1f38d$export$c5251b9e124bf29)(ref), [
        ref
    ]);
    let isFocused = (0, $41Ubl$useRef)(false);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        ...props,
        isDisabled: state.isOpen,
        onBlurWithin: (e)=>{
            // Ignore when focus moves into the popover.
            let dialog = document.getElementById(dialogId);
            if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(dialog, e.relatedTarget)) {
                isFocused.current = false;
                props.onBlur?.(e);
                props.onFocusChange?.(false);
            }
        },
        onFocusWithin: (e)=>{
            if (!isFocused.current) {
                isFocused.current = true;
                props.onFocus?.(e);
                props.onFocusChange?.(true);
            }
        }
    });
    return {
        groupProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
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
            [(0, $7541913c0284d84b$export$300019f83c56d282)]: 'presentation',
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
            [(0, $41Ubl$privateValidationStateProp)]: state,
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


export {$6902a2bb26917a07$export$42df105a73306d51 as useDatePicker};
//# sourceMappingURL=useDatePicker.mjs.map
