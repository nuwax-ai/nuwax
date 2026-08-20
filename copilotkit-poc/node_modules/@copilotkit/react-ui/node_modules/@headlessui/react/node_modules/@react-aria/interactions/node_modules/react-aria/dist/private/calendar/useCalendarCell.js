import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getEraFormat as $408a9e02d11c4766$export$134cbb7fb09a9522, hookData as $408a9e02d11c4766$export$653eddfc964b0f8a} from "./utils.js";
import {getInteractionModality as $b50b1cc8a843ace7$export$630ff653c5ada6a9} from "../interactions/useFocusVisible.js";
import {getScrollParent as $5b46e0a1626c2890$export$cfa2225e87938781} from "../utils/getScrollParent.js";
import $7X9UG$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {scrollIntoViewport as $6507765bd7f5ad94$export$c826860796309d1b} from "../utils/scrollIntoView.js";
import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useDeepMemo as $c94834a103455fff$export$722debc0e56fea39} from "../utils/useDeepMemo.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {isSameDay as $7X9UG$isSameDay, isEqualDay as $7X9UG$isEqualDay, isToday as $7X9UG$isToday} from "@internationalized/date";
import {useMemo as $7X9UG$useMemo, useRef as $7X9UG$useRef, useEffect as $7X9UG$useEffect} from "react";


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














function $843c9cda8bf3c664$export$136073280381448e(props, state, ref) {
    let { date: date, isDisabled: isDisabled } = props;
    let { errorMessageId: errorMessageId, selectedDateDescription: selectedDateDescription } = (0, $408a9e02d11c4766$export$653eddfc964b0f8a).get(state);
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($7X9UG$intlStringsjs))), '@react-aria/calendar');
    let dateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        era: (0, $408a9e02d11c4766$export$134cbb7fb09a9522)(date),
        timeZone: state.timeZone
    });
    let isFocused = state.isCellFocused(date) && !props.isOutsideMonth;
    isDisabled = isDisabled || state.isCellDisabled(date) || !!props.isOutsideMonth;
    let isUnavailable = state.isCellUnavailable(date);
    let isSelectable = !isDisabled && !isUnavailable;
    let isSelected = state.isSelected(date) && isSelectable;
    let isInvalid = false;
    if (state.isValueInvalid) {
        if ('highlightedRange' in state) isInvalid = !state.anchorDate && state.highlightedRange != null && date.compare(state.highlightedRange.start) >= 0 && date.compare(state.highlightedRange.end) <= 0;
        else if (Array.isArray(state.value)) isInvalid = state.value.some((value)=>(0, $7X9UG$isSameDay)(value, date));
        else if (state.value) isInvalid = (0, $7X9UG$isSameDay)(state.value, date);
    }
    if (isInvalid && !isDisabled) isSelected = true;
    // For performance, reuse the same date object as before if the new date prop is the same.
    // This allows subsequent useMemo results to be reused.
    date = (0, $c94834a103455fff$export$722debc0e56fea39)(date, (0, $7X9UG$isEqualDay));
    let nativeDate = (0, $7X9UG$useMemo)(()=>date.toDate(state.timeZone), [
        date,
        state.timeZone
    ]);
    // aria-label should be localize Day of week, Month, Day and Year without Time.
    let isDateToday = (0, $7X9UG$isToday)(date, state.timeZone);
    let label = (0, $7X9UG$useMemo)(()=>{
        let label = '';
        // If this is a range calendar, add a description of the full selected range
        // to the first and last selected date.
        if ('highlightedRange' in state && state.value && !state.anchorDate && ((0, $7X9UG$isSameDay)(date, state.value.start) || (0, $7X9UG$isSameDay)(date, state.value.end))) label = selectedDateDescription + ', ';
        label += dateFormatter.format(nativeDate);
        if (isDateToday) // If date is today, set appropriate string depending on selected state:
        label = stringFormatter.format(isSelected ? 'todayDateSelected' : 'todayDate', {
            date: label
        });
        else if (isSelected) // If date is selected but not today:
        label = stringFormatter.format('dateSelected', {
            date: label
        });
        if (state.minValue && (0, $7X9UG$isSameDay)(date, state.minValue)) label += ', ' + stringFormatter.format('minimumDate');
        else if (state.maxValue && (0, $7X9UG$isSameDay)(date, state.maxValue)) label += ', ' + stringFormatter.format('maximumDate');
        return label;
    }, [
        dateFormatter,
        nativeDate,
        stringFormatter,
        isSelected,
        isDateToday,
        date,
        state,
        selectedDateDescription
    ]);
    // When a cell is focused and this is a range calendar, add a prompt to help
    // screenreader users know that they are in a range selection mode.
    let rangeSelectionPrompt = '';
    if ('anchorDate' in state && isFocused && !state.isReadOnly && isSelectable) {
        // If selection has started add "click to finish selecting range"
        if (state.anchorDate) rangeSelectionPrompt = stringFormatter.format('finishRangeSelectionPrompt');
        else rangeSelectionPrompt = stringFormatter.format('startRangeSelectionPrompt');
    }
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(rangeSelectionPrompt);
    let isAnchorPressed = (0, $7X9UG$useRef)(false);
    let isRangeBoundaryPressed = (0, $7X9UG$useRef)(false);
    let touchDragTimerRef = (0, $7X9UG$useRef)(undefined);
    let { pressProps: pressProps, isPressed: isPressed } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
        // When dragging to select a range, we don't want dragging over the original anchor
        // again to trigger onPressStart. Cancel presses immediately when the pointer exits.
        shouldCancelOnPointerExit: 'anchorDate' in state && !!state.anchorDate,
        preventFocusOnPress: true,
        isDisabled: !isSelectable || state.isReadOnly,
        onPressStart (e) {
            if (state.isReadOnly) {
                state.setFocusedDate(date);
                state.setFocused(true);
                return;
            }
            if ('highlightedRange' in state && !state.anchorDate && (e.pointerType === 'mouse' || e.pointerType === 'touch')) {
                // Allow dragging the start or end date of a range to modify it
                // rather than starting a new selection.
                // Don't allow dragging when invalid, or weird jumping behavior may occur as date ranges
                // are constrained to available dates. The user will need to select a new range in this case.
                if (state.highlightedRange && !isInvalid) {
                    if ((0, $7X9UG$isSameDay)(date, state.highlightedRange.start)) {
                        state.setAnchorDate(state.highlightedRange.end);
                        state.setFocusedDate(date);
                        state.setFocused(true);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    } else if ((0, $7X9UG$isSameDay)(date, state.highlightedRange.end)) {
                        state.setAnchorDate(state.highlightedRange.start);
                        state.setFocusedDate(date);
                        state.setFocused(true);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    }
                }
                let startDragging = ()=>{
                    state.setDragging(true);
                    touchDragTimerRef.current = undefined;
                    state.selectDate(date);
                    state.setFocusedDate(date);
                    state.setFocused(true);
                    isAnchorPressed.current = true;
                };
                // Start selection on mouse/touch down so users can drag to select a range.
                // On touch, delay dragging to determine if the user really meant to scroll.
                if (e.pointerType === 'touch') touchDragTimerRef.current = setTimeout(startDragging, 200);
                else startDragging();
            }
        },
        onPressEnd () {
            isRangeBoundaryPressed.current = false;
            isAnchorPressed.current = false;
            clearTimeout(touchDragTimerRef.current);
            touchDragTimerRef.current = undefined;
        },
        onPress () {
            // For non-range selection, always select on press up.
            if (!('anchorDate' in state) && !state.isReadOnly) {
                state.selectDate(date);
                state.setFocusedDate(date);
                state.setFocused(true);
            }
        },
        onPressUp (e) {
            if (state.isReadOnly) return;
            // If the user tapped quickly, the date won't be selected yet and the
            // timer will still be in progress. In this case, select the date on touch up.
            // Timer is cleared in onPressEnd.
            if ('anchorDate' in state && touchDragTimerRef.current) {
                state.selectDate(date);
                state.setFocusedDate(date);
                state.setFocused(true);
            }
            if ('anchorDate' in state) {
                if (isRangeBoundaryPressed.current) // When clicking on the start or end date of an already selected range,
                // start a new selection on press up to also allow dragging the date to
                // change the existing range.
                state.setAnchorDate(date);
                else if (state.anchorDate && !isAnchorPressed.current) {
                    // When releasing a drag or pressing the end date of a range, select it.
                    state.selectDate(date);
                    state.setFocusedDate(date);
                    state.setFocused(true);
                } else if (e.pointerType === 'keyboard' && !state.anchorDate) {
                    // For range selection, auto-advance the focused date by one if using keyboard.
                    // This gives an indication that you're selecting a range rather than a single date.
                    // For mouse, this is unnecessary because users will see the indication on hover. For screen readers,
                    // there will be an announcement to "click to finish selecting range" (above).
                    state.selectDate(date);
                    state.focusNearestAvailableDate(date);
                } else if (e.pointerType === 'virtual') {
                    // For screen readers, just select the date on click.
                    state.selectDate(date);
                    state.setFocusedDate(date);
                    state.setFocused(true);
                }
            }
        }
    });
    let tabIndex = undefined;
    if (!isDisabled) tabIndex = (0, $7X9UG$isSameDay)(date, state.focusedDate) ? 0 : -1;
    // Focus the button in the DOM when the state updates.
    (0, $7X9UG$useEffect)(()=>{
        if (isFocused && ref.current) {
            (0, $d559d872031c749f$export$de79e2c695e052f3)(ref.current);
            // Scroll into view if navigating with a keyboard, otherwise
            // try not to shift the view under the user's mouse/finger.
            // If in a overlay, scrollIntoViewport will only cause scrolling
            // up to the overlay scroll body to prevent overlay shifting.
            // Also only scroll into view if the cell actually got focused.
            // There are some cases where the cell might be disabled or inside,
            // an inert container and we don't want to scroll then.
            if ((0, $b50b1cc8a843ace7$export$630ff653c5ada6a9)() !== 'pointer' && (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === ref.current) (0, $6507765bd7f5ad94$export$c826860796309d1b)(ref.current, {
                containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
            });
        }
    }, [
        isFocused,
        ref
    ]);
    let cellDateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        day: 'numeric',
        timeZone: state.timeZone,
        calendar: date.calendar.identifier
    });
    let formattedDate = (0, $7X9UG$useMemo)(()=>cellDateFormatter.formatToParts(nativeDate).find((part)=>part.type === 'day').value, [
        cellDateFormatter,
        nativeDate
    ]);
    return {
        cellProps: {
            role: 'gridcell',
            'aria-disabled': !isSelectable || undefined,
            'aria-selected': isSelected || undefined,
            'aria-invalid': isInvalid || undefined
        },
        buttonProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(pressProps, {
            onFocus () {
                if (!isDisabled) {
                    state.setFocusedDate(date);
                    state.setFocused(true);
                }
            },
            tabIndex: tabIndex,
            role: 'button',
            'aria-disabled': !isSelectable || undefined,
            'aria-label': label,
            'aria-invalid': isInvalid || undefined,
            'aria-describedby': [
                isInvalid ? errorMessageId : undefined,
                descriptionProps['aria-describedby']
            ].filter(Boolean).join(' ') || undefined,
            onPointerEnter (e) {
                // Highlight the date on hover or drag over a date when selecting a range.
                if ('highlightDate' in state && (e.pointerType !== 'touch' || state.isDragging) && isSelectable) state.highlightDate(date);
            },
            onPointerDown (e) {
                // This is necessary on touch devices to allow dragging
                // outside the original pressed element.
                // (JSDOM does not support this)
                let target = (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e);
                if (target instanceof HTMLElement && 'releasePointerCapture' in target) {
                    if ('hasPointerCapture' in target) {
                        if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
                    } else target.releasePointerCapture(e.pointerId);
                }
            },
            onContextMenu (e) {
                // Prevent context menu on long press.
                e.preventDefault();
            }
        }),
        isPressed: isPressed,
        isFocused: isFocused,
        isSelected: isSelected,
        isDisabled: isDisabled,
        isUnavailable: isUnavailable,
        isOutsideVisibleRange: date.compare(state.visibleRange.start) < 0 || date.compare(state.visibleRange.end) > 0,
        isInvalid: isInvalid,
        formattedDate: formattedDate
    };
}


export {$843c9cda8bf3c664$export$136073280381448e as useCalendarCell};
//# sourceMappingURL=useCalendarCell.js.map
