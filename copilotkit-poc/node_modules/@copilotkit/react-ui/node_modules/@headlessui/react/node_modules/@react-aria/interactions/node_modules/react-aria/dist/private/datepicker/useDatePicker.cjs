var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $45851fded752e83c$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $f6a0574fa98a3f25$exports = require("./useDateField.cjs");
var $593fdd0ed62674c2$exports = require("./useDatePickerGroup.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $e3486d9c44549186$exports = require("../label/useField.cjs");
var $b4f85e31b7b8044c$exports = require("../interactions/useFocusWithin.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $9kneP$reactstatelyprivateformuseFormValidationState = require("react-stately/private/form/useFormValidationState");
var $9kneP$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDatePicker", function () { return $5b45bf8ed93d56ea$export$42df105a73306d51; });
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














function $5b45bf8ed93d56ea$export$42df105a73306d51(props, state, ref) {
    let buttonId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let dialogId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let fieldId = (0, $7ac82d1fee77eb8a$exports.useId)();
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($45851fded752e83c$exports))), '@react-aria/datepicker');
    let { isInvalid: isInvalid, validationErrors: validationErrors, validationDetails: validationDetails } = state.displayValidation;
    let { labelProps: labelProps, fieldProps: fieldProps, descriptionProps: descriptionProps, errorMessageProps: errorMessageProps } = (0, $e3486d9c44549186$exports.useField)({
        ...props,
        labelElementType: 'span',
        isInvalid: isInvalid,
        errorMessage: props.errorMessage || validationErrors
    });
    let groupProps = (0, $593fdd0ed62674c2$exports.useDatePickerGroup)(state, ref);
    let labelledBy = fieldProps['aria-labelledby'] || fieldProps.id;
    let { locale: locale } = (0, $2522e612fa919664$exports.useLocale)();
    let date = state.formatValue(locale, {
        month: 'long'
    });
    let description = date ? stringFormatter.format('selectedDateDescription', {
        date: date
    }) : '';
    let descProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(description);
    let ariaDescribedBy = [
        descProps['aria-describedby'],
        fieldProps['aria-describedby']
    ].filter(Boolean).join(' ') || undefined;
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props);
    let focusManager = (0, $9kneP$react.useMemo)(()=>(0, $9fb4ac1cc58342cc$exports.createFocusManager)(ref), [
        ref
    ]);
    let isFocused = (0, $9kneP$react.useRef)(false);
    let { focusWithinProps: focusWithinProps } = (0, $b4f85e31b7b8044c$exports.useFocusWithin)({
        ...props,
        isDisabled: state.isOpen,
        onBlurWithin: (e)=>{
            // Ignore when focus moves into the popover.
            let dialog = document.getElementById(dialogId);
            if (!(0, $da02ee888921bc9e$exports.nodeContains)(dialog, e.relatedTarget)) {
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
        groupProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, groupProps, fieldProps, descProps, focusWithinProps, {
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
            [(0, $f6a0574fa98a3f25$exports.roleSymbol)]: 'presentation',
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
            [(0, $9kneP$reactstatelyprivateformuseFormValidationState.privateValidationStateProp)]: state,
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


//# sourceMappingURL=useDatePicker.cjs.map
