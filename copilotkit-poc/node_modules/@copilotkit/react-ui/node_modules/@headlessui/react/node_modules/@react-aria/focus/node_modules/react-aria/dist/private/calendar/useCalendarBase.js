import {announce as $a53edfcc12185fd0$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.js";
import {filterDOMProps as $6a28a4717b9a4e1c$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.js";
import {hookData as $408a9e02d11c4766$export$653eddfc964b0f8a, useSelectedDateDescription as $408a9e02d11c4766$export$b6df97c887c38e1a, useVisibleRangeDescription as $408a9e02d11c4766$export$31afe65d91ef6e8} from "./utils.js";
import $htFjR$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useSlotId as $0292efe68908de6b$export$b4cc09c592e8fdb8} from "../utils/useId.js";
import {useUpdateEffect as $b444858e8a82ccea$export$496315a1608d9602} from "../utils/useUpdateEffect.js";
import {useState as $htFjR$useState} from "react";


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









function $f9fc7ddb24f737a3$export$d652b3ea2d672d5b(props, state) {
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($htFjR$intlStringsjs))), '@react-aria/calendar');
    let domProps = (0, $6a28a4717b9a4e1c$export$457c3d6518dd4c6f)(props);
    let title = (0, $408a9e02d11c4766$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, false);
    let visibleRangeDescription = (0, $408a9e02d11c4766$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, true);
    // Announce when the visible date range changes
    (0, $b444858e8a82ccea$export$496315a1608d9602)(()=>{
        // only when pressing the Previous or Next button
        if (!state.isFocused) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(visibleRangeDescription);
    }, [
        visibleRangeDescription
    ]);
    // Announce when the selected value changes
    let selectedDateDescription = (0, $408a9e02d11c4766$export$b6df97c887c38e1a)(state);
    (0, $b444858e8a82ccea$export$496315a1608d9602)(()=>{
        if (selectedDateDescription) (0, $a53edfcc12185fd0$export$a9b970dcc4ae71a9)(selectedDateDescription, 'polite', 4000);
    // handle an update to the caption that describes the currently selected range, to announce the new value
    }, [
        selectedDateDescription
    ]);
    let errorMessageId = (0, $0292efe68908de6b$export$b4cc09c592e8fdb8)([
        Boolean(props.errorMessage),
        props.isInvalid,
        props.validationState
    ]);
    // Pass the label to the child grid elements.
    (0, $408a9e02d11c4766$export$653eddfc964b0f8a).set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: props['aria-labelledby'],
        errorMessageId: errorMessageId,
        selectedDateDescription: selectedDateDescription
    });
    // If the next or previous buttons become disabled while they are focused, move focus to the calendar body.
    let [nextFocused, setNextFocused] = (0, $htFjR$useState)(false);
    let nextDisabled = props.isDisabled || state.isNextVisibleRangeInvalid();
    if (nextDisabled && nextFocused) {
        setNextFocused(false);
        state.setFocused(true);
    }
    let [previousFocused, setPreviousFocused] = (0, $htFjR$useState)(false);
    let previousDisabled = props.isDisabled || state.isPreviousVisibleRangeInvalid();
    if (previousDisabled && previousFocused) {
        setPreviousFocused(false);
        state.setFocused(true);
    }
    let labelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        id: props['id'],
        'aria-label': [
            props['aria-label'],
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': props['aria-labelledby']
    });
    return {
        calendarProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(domProps, labelProps, {
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


export {$f9fc7ddb24f737a3$export$d652b3ea2d672d5b as useCalendarBase};
//# sourceMappingURL=useCalendarBase.js.map
