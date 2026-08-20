var $74b2c5b1e7ea9589$exports = require("../live-announcer/LiveAnnouncer.cjs");
var $b97366b6eabbb2cc$exports = require("../utils/filterDOMProps.cjs");
var $b4aac2eb56fa5943$exports = require("./utils.cjs");
var $7042f522bd1a7f7b$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $3f0180db35edfbf7$exports = require("../utils/useLabels.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $c4703f4a6fffa1e7$exports = require("../utils/useUpdateEffect.cjs");
var $c2ROt$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCalendarBase", function () { return $aa622b24499a77e3$export$d652b3ea2d672d5b; });
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









function $aa622b24499a77e3$export$d652b3ea2d672d5b(props, state) {
    let stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($7042f522bd1a7f7b$exports))), '@react-aria/calendar');
    let domProps = (0, $b97366b6eabbb2cc$exports.filterDOMProps)(props);
    let title = (0, $b4aac2eb56fa5943$exports.useVisibleRangeDescription)(state.visibleRange.start, state.visibleRange.end, state.timeZone, false);
    let visibleRangeDescription = (0, $b4aac2eb56fa5943$exports.useVisibleRangeDescription)(state.visibleRange.start, state.visibleRange.end, state.timeZone, true);
    // Announce when the visible date range changes
    (0, $c4703f4a6fffa1e7$exports.useUpdateEffect)(()=>{
        // only when pressing the Previous or Next button
        if (!state.isFocused) (0, $74b2c5b1e7ea9589$exports.announce)(visibleRangeDescription);
    }, [
        visibleRangeDescription
    ]);
    // Announce when the selected value changes
    let selectedDateDescription = (0, $b4aac2eb56fa5943$exports.useSelectedDateDescription)(state);
    (0, $c4703f4a6fffa1e7$exports.useUpdateEffect)(()=>{
        if (selectedDateDescription) (0, $74b2c5b1e7ea9589$exports.announce)(selectedDateDescription, 'polite', 4000);
    // handle an update to the caption that describes the currently selected range, to announce the new value
    }, [
        selectedDateDescription
    ]);
    let errorMessageId = (0, $7ac82d1fee77eb8a$exports.useSlotId)([
        Boolean(props.errorMessage),
        props.isInvalid,
        props.validationState
    ]);
    // Pass the label to the child grid elements.
    (0, $b4aac2eb56fa5943$exports.hookData).set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: props['aria-labelledby'],
        errorMessageId: errorMessageId,
        selectedDateDescription: selectedDateDescription
    });
    // If the next or previous buttons become disabled while they are focused, move focus to the calendar body.
    let [nextFocused, setNextFocused] = (0, $c2ROt$react.useState)(false);
    let nextDisabled = props.isDisabled || state.isNextVisibleRangeInvalid();
    if (nextDisabled && nextFocused) {
        setNextFocused(false);
        state.setFocused(true);
    }
    let [previousFocused, setPreviousFocused] = (0, $c2ROt$react.useState)(false);
    let previousDisabled = props.isDisabled || state.isPreviousVisibleRangeInvalid();
    if (previousDisabled && previousFocused) {
        setPreviousFocused(false);
        state.setFocused(true);
    }
    let labelProps = (0, $3f0180db35edfbf7$exports.useLabels)({
        id: props['id'],
        'aria-label': [
            props['aria-label'],
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': props['aria-labelledby']
    });
    return {
        calendarProps: (0, $89b39774f3b79dbb$exports.mergeProps)(domProps, labelProps, {
            role: 'application',
            'aria-details': props['aria-details'] || undefined,
            'aria-describedby': props['aria-describedby'] || undefined
        }),
        nextButtonProps: {
            onPress: ()=>state.focusNextPage(),
            'aria-label': stringFormatter.format('next'),
            isDisabled: nextDisabled,
            onFocusChange: setNextFocused
        },
        prevButtonProps: {
            onPress: ()=>state.focusPreviousPage(),
            'aria-label': stringFormatter.format('previous'),
            isDisabled: previousDisabled,
            onFocusChange: setPreviousFocused
        },
        errorMessageProps: {
            id: errorMessageId
        },
        title: title
    };
}


//# sourceMappingURL=useCalendarBase.cjs.map
