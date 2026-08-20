import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getEraFormat as $9bac9bf03b87f160$export$134cbb7fb09a9522, hookData as $9bac9bf03b87f160$export$653eddfc964b0f8a} from "./utils.mjs";
import {getInteractionModality as $8f5a2122b0992be3$export$630ff653c5ada6a9} from "../interactions/useFocusVisible.mjs";
import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import $8nrHP$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {scrollIntoViewport as $51a3e22a5186a962$export$c826860796309d1b} from "../utils/scrollIntoView.mjs";
import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useDeepMemo as $9c268ab73a5d55e5$export$722debc0e56fea39} from "../utils/useDeepMemo.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";
import {isSameDay as $8nrHP$isSameDay, isEqualDay as $8nrHP$isEqualDay, isToday as $8nrHP$isToday} from "@internationalized/date";
import {useMemo as $8nrHP$useMemo, useRef as $8nrHP$useRef, useEffect as $8nrHP$useEffect} from "react";


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














function $be61a22f9aa88c7c$export$136073280381448e(props, state, ref) {
    let { date: date, isDisabled: isDisabled } = props;
    let { errorMessageId: errorMessageId, selectedDateDescription: selectedDateDescription } = (0, $9bac9bf03b87f160$export$653eddfc964b0f8a).get(state);
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($8nrHP$intlStringsmjs))), '@react-aria/calendar');
    let dateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        era: (0, $9bac9bf03b87f160$export$134cbb7fb09a9522)(date),
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
        else if (Array.isArray(state.value)) isInvalid = state.value.some((value)=>(0, $8nrHP$isSameDay)(value, date));
        else if (state.value) isInvalid = (0, $8nrHP$isSameDay)(state.value, date);
    }
    if (isInvalid && !isDisabled) isSelected = true;
    // For performance, reuse the same date object as before if the new date prop is the same.
    // This allows subsequent useMemo results to be reused.
    date = (0, $9c268ab73a5d55e5$export$722debc0e56fea39)(date, (0, $8nrHP$isEqualDay));
    let nativeDate = (0, $8nrHP$useMemo)(()=>date.toDate(state.timeZone), [
        date,
        state.timeZone
    ]);
    // aria-label should be localize Day of week, Month, Day and Year without Time.
    let isDateToday = (0, $8nrHP$isToday)(date, state.timeZone);
    let label = (0, $8nrHP$useMemo)(()=>{
        let label = '';
        // If this is a range calendar, add a description of the full selected range
        // to the first and last selected date.
        if ('highlightedRange' in state && state.value && !state.anchorDate && ((0, $8nrHP$isSameDay)(date, state.value.start) || (0, $8nrHP$isSameDay)(date, state.value.end))) label = selectedDateDescription + ', ';
        label += dateFormatter.format(nativeDate);
        if (isDateToday) // If date is today, set appropriate string depending on selected state:
        label = stringFormatter.format(isSelected ? 'todayDateSelected' : 'todayDate', {
            date: label
        });
        else if (isSelected) // If date is selected but not today:
        label = stringFormatter.format('dateSelected', {
            date: label
        });
        if (state.minValue && (0, $8nrHP$isSameDay)(date, state.minValue)) label += ', ' + stringFormatter.format('minimumDate');
        else if (state.maxValue && (0, $8nrHP$isSameDay)(date, state.maxValue)) label += ', ' + stringFormatter.format('maximumDate');
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
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(rangeSelectionPrompt);
    let isAnchorPressed = (0, $8nrHP$useRef)(false);
    let isRangeBoundaryPressed = (0, $8nrHP$useRef)(false);
    let touchDragTimerRef = (0, $8nrHP$useRef)(undefined);
    let { pressProps: pressProps, isPressed: isPressed } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
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
                    if ((0, $8nrHP$isSameDay)(date, state.highlightedRange.start)) {
                        state.setAnchorDate(state.highlightedRange.end);
                        state.setFocusedDate(date);
                        state.setFocused(true);
                        state.setDragging(true);
                        isRangeBoundaryPressed.current = true;
                        return;
                    } else if ((0, $8nrHP$isSameDay)(date, state.highlightedRange.end)) {
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
    if (!isDisabled) tabIndex = (0, $8nrHP$isSameDay)(date, state.focusedDate) ? 0 : -1;
    // Focus the button in the DOM when the state updates.
    (0, $8nrHP$useEffect)(()=>{
        if (isFocused && ref.current) {
            (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(ref.current);
            // Scroll into view if navigating with a keyboard, otherwise
            // try not to shift the view under the user's mouse/finger.
            // If in a overlay, scrollIntoViewport will only cause scrolling
            // up to the overlay scroll body to prevent overlay shifting.
            // Also only scroll into view if the cell actually got focused.
            // There are some cases where the cell might be disabled or inside,
            // an inert container and we don't want to scroll then.
            if ((0, $8f5a2122b0992be3$export$630ff653c5ada6a9)() !== 'pointer' && (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() === ref.current) (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
                containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
            });
        }
    }, [
        isFocused,
        ref
    ]);
    let cellDateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        day: 'numeric',
        timeZone: state.timeZone,
        calendar: date.calendar.identifier
    });
    let formattedDate = (0, $8nrHP$useMemo)(()=>cellDateFormatter.formatToParts(nativeDate).find((part)=>part.type === 'day').value, [
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
        buttonProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(pressProps, {
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
                let target = (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e);
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


export {$be61a22f9aa88c7c$export$136073280381448e as useCalendarCell};
//# sourceMappingURL=useCalendarCell.mjs.map
