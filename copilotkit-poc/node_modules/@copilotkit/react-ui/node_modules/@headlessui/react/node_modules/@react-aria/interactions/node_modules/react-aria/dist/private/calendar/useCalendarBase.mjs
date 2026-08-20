import {announce as $a46cf152bb926da5$export$a9b970dcc4ae71a9} from "../live-announcer/LiveAnnouncer.mjs";
import {filterDOMProps as $8e9d2fae0ecb9001$export$457c3d6518dd4c6f} from "../utils/filterDOMProps.mjs";
import {hookData as $9bac9bf03b87f160$export$653eddfc964b0f8a, useSelectedDateDescription as $9bac9bf03b87f160$export$b6df97c887c38e1a, useVisibleRangeDescription as $9bac9bf03b87f160$export$31afe65d91ef6e8} from "./utils.mjs";
import $aPiNG$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useSlotId as $390e54f620492c70$export$b4cc09c592e8fdb8} from "../utils/useId.mjs";
import {useUpdateEffect as $3c71b1595a147f24$export$496315a1608d9602} from "../utils/useUpdateEffect.mjs";
import {useState as $aPiNG$useState} from "react";


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









function $4ca33167bdccdd26$export$d652b3ea2d672d5b(props, state) {
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($aPiNG$intlStringsmjs))), '@react-aria/calendar');
    let domProps = (0, $8e9d2fae0ecb9001$export$457c3d6518dd4c6f)(props);
    let title = (0, $9bac9bf03b87f160$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, false);
    let visibleRangeDescription = (0, $9bac9bf03b87f160$export$31afe65d91ef6e8)(state.visibleRange.start, state.visibleRange.end, state.timeZone, true);
    // Announce when the visible date range changes
    (0, $3c71b1595a147f24$export$496315a1608d9602)(()=>{
        // only when pressing the Previous or Next button
        if (!state.isFocused) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(visibleRangeDescription);
    }, [
        visibleRangeDescription
    ]);
    // Announce when the selected value changes
    let selectedDateDescription = (0, $9bac9bf03b87f160$export$b6df97c887c38e1a)(state);
    (0, $3c71b1595a147f24$export$496315a1608d9602)(()=>{
        if (selectedDateDescription) (0, $a46cf152bb926da5$export$a9b970dcc4ae71a9)(selectedDateDescription, 'polite', 4000);
    // handle an update to the caption that describes the currently selected range, to announce the new value
    }, [
        selectedDateDescription
    ]);
    let errorMessageId = (0, $390e54f620492c70$export$b4cc09c592e8fdb8)([
        Boolean(props.errorMessage),
        props.isInvalid,
        props.validationState
    ]);
    // Pass the label to the child grid elements.
    (0, $9bac9bf03b87f160$export$653eddfc964b0f8a).set(state, {
        ariaLabel: props['aria-label'],
        ariaLabelledBy: props['aria-labelledby'],
        errorMessageId: errorMessageId,
        selectedDateDescription: selectedDateDescription
    });
    // If the next or previous buttons become disabled while they are focused, move focus to the calendar body.
    let [nextFocused, setNextFocused] = (0, $aPiNG$useState)(false);
    let nextDisabled = props.isDisabled || state.isNextVisibleRangeInvalid();
    if (nextDisabled && nextFocused) {
        setNextFocused(false);
        state.setFocused(true);
    }
    let [previousFocused, setPreviousFocused] = (0, $aPiNG$useState)(false);
    let previousDisabled = props.isDisabled || state.isPreviousVisibleRangeInvalid();
    if (previousDisabled && previousFocused) {
        setPreviousFocused(false);
        state.setFocused(true);
    }
    let labelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        id: props['id'],
        'aria-label': [
            props['aria-label'],
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': props['aria-labelledby']
    });
    return {
        calendarProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(domProps, labelProps, {
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


export {$4ca33167bdccdd26$export$d652b3ea2d672d5b as useCalendarBase};
//# sourceMappingURL=useCalendarBase.mjs.map
