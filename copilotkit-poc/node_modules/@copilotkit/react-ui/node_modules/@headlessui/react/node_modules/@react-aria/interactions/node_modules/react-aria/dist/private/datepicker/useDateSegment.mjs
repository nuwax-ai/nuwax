import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import {hookData as $7541913c0284d84b$export$653eddfc964b0f8a} from "./useDateField.mjs";
import {isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1, isMac as $2add3ce32c6007eb$export$9ac100e40613ea10} from "../utils/platform.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {scrollIntoViewport as $51a3e22a5186a962$export$c826860796309d1b} from "../utils/scrollIntoView.mjs";
import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useDisplayNames as $40cf8faa4dad0740$export$d42c60378c8168f8} from "./useDisplayNames.mjs";
import {useEvent as $600b3cf69ae46262$export$90fc3a17d93f704c} from "../utils/useEvent.mjs";
import {useFilter as $ef182bb9912241d8$export$3274cf84b703fff} from "../i18n/useFilter.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLayoutEffect as $c4867b2f328c2698$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useSpinButton as $757ec6630f26125c$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.mjs";
import {toCalendar as $dk9mG$toCalendar, CalendarDate as $dk9mG$CalendarDate} from "@internationalized/date";
import {NumberParser as $dk9mG$NumberParser} from "@internationalized/number";
import $dk9mG$react, {useRef as $dk9mG$useRef, useMemo as $dk9mG$useMemo} from "react";

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

















function $d51706f903be7eab$export$1315d136e6f7581(segment, state, ref) {
    let enteredKeys = (0, $dk9mG$useRef)('');
    let { locale: locale, direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let displayNames = (0, $40cf8faa4dad0740$export$d42c60378c8168f8)();
    let { ariaLabel: ariaLabel, ariaLabelledBy: ariaLabelledBy, ariaDescribedBy: ariaDescribedBy, focusManager: focusManager } = (0, $7541913c0284d84b$export$653eddfc964b0f8a).get(state);
    let textValue = segment.isPlaceholder ? '' : segment.text;
    let options = (0, $dk9mG$useMemo)(()=>state.dateFormatter.resolvedOptions(), [
        state.dateFormatter
    ]);
    let monthDateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        month: 'long',
        timeZone: options.timeZone
    });
    let hourDateFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        hour: 'numeric',
        hour12: options.hour12,
        timeZone: options.timeZone
    });
    if (segment.type === 'month' && !segment.isPlaceholder) {
        let monthTextValue = monthDateFormatter.format(state.dateValue);
        textValue = monthTextValue !== textValue ? `${textValue} \u{2013} ${monthTextValue}` : monthTextValue;
    } else if (segment.type === 'hour' && !segment.isPlaceholder) textValue = hourDateFormatter.format(state.dateValue);
    let { spinButtonProps: spinButtonProps } = (0, $757ec6630f26125c$export$e908e06f4b8e3402)({
        // The ARIA spec says aria-valuenow is optional if there's no value, but aXe seems to require it.
        // This doesn't seem to have any negative effects with real AT since we also use aria-valuetext.
        // https://github.com/dequelabs/axe-core/issues/3505
        value: segment.value ?? undefined,
        textValue: textValue,
        minValue: segment.minValue,
        maxValue: segment.maxValue,
        isDisabled: state.isDisabled,
        isReadOnly: state.isReadOnly || !segment.isEditable,
        isRequired: state.isRequired,
        onIncrement: ()=>{
            enteredKeys.current = '';
            state.increment(segment.type);
        },
        onDecrement: ()=>{
            enteredKeys.current = '';
            state.decrement(segment.type);
        },
        onIncrementPage: ()=>{
            enteredKeys.current = '';
            state.incrementPage(segment.type);
        },
        onDecrementPage: ()=>{
            enteredKeys.current = '';
            state.decrementPage(segment.type);
        },
        onIncrementToMax: ()=>{
            enteredKeys.current = '';
            state.incrementToMax(segment.type);
        },
        onDecrementToMin: ()=>{
            enteredKeys.current = '';
            state.decrementToMin(segment.type);
        }
    });
    let parser = (0, $dk9mG$useMemo)(()=>new (0, $dk9mG$NumberParser)(locale, {
            maximumFractionDigits: 0
        }), [
        locale
    ]);
    let backspace = ()=>{
        if (segment.text === segment.placeholder) focusManager.focusPrevious();
        if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly && !segment.isPlaceholder) {
            let newValue = segment.text.slice(0, -1);
            let parsed = parser.parse(newValue);
            newValue = parsed === 0 ? '' : newValue;
            if (newValue.length === 0 || parsed === 0) state.clearSegment(segment.type);
            else state.setSegment(segment.type, parsed);
            enteredKeys.current = newValue;
        } else if (segment.type === 'dayPeriod' || segment.type === 'era') state.clearSegment(segment.type);
    };
    let onKeyDown = (e)=>{
        // Firefox does not fire selectstart for Ctrl/Cmd + A
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1742153
        if (e.key === 'a' && ((0, $2add3ce32c6007eb$export$9ac100e40613ea10)() ? e.metaKey : e.ctrlKey)) e.preventDefault();
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        switch(e.key){
            case 'Backspace':
            case 'Delete':
                // Safari on iOS does not fire beforeinput for the backspace key because the cursor is at the start.
                e.preventDefault();
                e.stopPropagation();
                backspace();
                break;
        }
    };
    // Safari dayPeriod option doesn't work...
    let { startsWith: startsWith } = (0, $ef182bb9912241d8$export$3274cf84b703fff)({
        sensitivity: 'base'
    });
    let amPmFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        hour: 'numeric',
        hour12: true
    });
    let am = (0, $dk9mG$useMemo)(()=>{
        let date = new Date();
        date.setHours(0);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === 'dayPeriod').value;
    }, [
        amPmFormatter
    ]);
    let pm = (0, $dk9mG$useMemo)(()=>{
        let date = new Date();
        date.setHours(12);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === 'dayPeriod').value;
    }, [
        amPmFormatter
    ]);
    // Get a list of formatted era names so users can type the first character to choose one.
    let eraFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        year: 'numeric',
        era: 'narrow',
        timeZone: 'UTC'
    });
    let eras = (0, $dk9mG$useMemo)(()=>{
        if (segment.type !== 'era') return [];
        let date = (0, $dk9mG$toCalendar)(new (0, $dk9mG$CalendarDate)(1, 1, 1), state.calendar);
        let eras = state.calendar.getEras().map((era)=>{
            let eraDate = date.set({
                year: 1,
                month: 1,
                day: 1,
                era: era
            }).toDate('UTC');
            let parts = eraFormatter.formatToParts(eraDate);
            let formatted = parts.find((p)=>p.type === 'era').value;
            return {
                era: era,
                formatted: formatted
            };
        });
        // Remove the common prefix from formatted values. This is so that in calendars with eras like
        // ERA0 and ERA1 (e.g. Ethiopic), users can press "0" and "1" to select an era. In other cases,
        // the first letter is used.
        let prefixLength = $d51706f903be7eab$var$commonPrefixLength(eras.map((era)=>era.formatted));
        if (prefixLength) for (let era of eras)era.formatted = era.formatted.slice(prefixLength);
        return eras;
    }, [
        eraFormatter,
        state.calendar,
        segment.type
    ]);
    let onInput = (key)=>{
        if (state.isDisabled || state.isReadOnly) return;
        let newValue = enteredKeys.current + key;
        switch(segment.type){
            case 'dayPeriod':
                if (startsWith(am, key)) state.setSegment('dayPeriod', 0);
                else if (startsWith(pm, key)) state.setSegment('dayPeriod', 1);
                else break;
                focusManager.focusNext();
                break;
            case 'era':
                {
                    let matched = eras.find((e)=>startsWith(e.formatted, key));
                    if (matched) {
                        state.setSegment('era', matched.era);
                        focusManager.focusNext();
                    }
                    break;
                }
            case 'day':
            case 'hour':
            case 'minute':
            case 'second':
            case 'month':
            case 'year':
                {
                    if (!parser.isValidPartialNumber(newValue)) return;
                    let numberValue = parser.parse(newValue);
                    let segmentValue = numberValue;
                    if (segment.maxValue !== undefined && numberValue > segment.maxValue) segmentValue = parser.parse(key);
                    if (isNaN(numberValue)) return;
                    state.setSegment(segment.type, segmentValue);
                    if (segment.maxValue !== undefined && (Number(numberValue + '0') > segment.maxValue || newValue.length >= String(segment.maxValue).length)) {
                        enteredKeys.current = '';
                        focusManager.focusNext();
                    } else enteredKeys.current = newValue;
                    break;
                }
        }
    };
    let onFocus = ()=>{
        enteredKeys.current = '';
        if (ref.current) (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
            containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
        });
        // Collapse selection to start or Chrome won't fire input events.
        let selection = window.getSelection();
        selection?.collapse(ref.current);
    };
    let documentRef = (0, $dk9mG$useRef)(typeof document !== 'undefined' ? document : null);
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(documentRef, 'selectionchange', ()=>{
        // Enforce that the selection is collapsed when inside a date segment.
        // Otherwise, when tapping on a segment in Android Chrome and then entering text,
        // composition events will be fired that break the DOM structure and crash the page.
        let selection = window.getSelection();
        if (selection?.anchorNode && (0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, selection?.anchorNode)) selection.collapse(ref.current);
    });
    let compositionRef = (0, $dk9mG$useRef)('');
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(ref, 'beforeinput', (e)=>{
        if (!ref.current) return;
        e.preventDefault();
        switch(e.inputType){
            case 'deleteContentBackward':
            case 'deleteContentForward':
                if (parser.isValidPartialNumber(segment.text) && !state.isReadOnly) backspace();
                break;
            case 'insertCompositionText':
                // insertCompositionText cannot be canceled.
                // Record the current state of the element so we can restore it in the `input` event below.
                compositionRef.current = ref.current.textContent;
                // Safari gets stuck in a composition state unless we also assign to the value here.
                // eslint-disable-next-line no-self-assign
                ref.current.textContent = ref.current.textContent;
                break;
            default:
                if (e.data != null) onInput(e.data);
                break;
        }
    });
    (0, $600b3cf69ae46262$export$90fc3a17d93f704c)(ref, 'input', (e)=>{
        let { inputType: inputType, data: data } = e;
        switch(inputType){
            case 'insertCompositionText':
                // Reset the DOM to how it was in the beforeinput event.
                if (ref.current) ref.current.textContent = compositionRef.current;
                // Android sometimes fires key presses of letters as composition events. Need to handle am/pm keys here too.
                // Can also happen e.g. with Pinyin keyboard on iOS.
                if (data != null && (startsWith(am, data) || startsWith(pm, data))) onInput(data);
                break;
        }
    });
    (0, $c4867b2f328c2698$export$e5c5a5f917a5871c)(()=>{
        let element = ref.current;
        return ()=>{
            // If the focused segment is removed, focus the previous one, or the next one if there was no previous one.
            if ((0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() === element) {
                let prev = focusManager.focusPrevious();
                if (!prev) focusManager.focusNext();
            }
        };
    }, [
        ref,
        focusManager
    ]);
    // spinbuttons cannot be focused with VoiceOver on iOS.
    let touchPropOverrides = (0, $2add3ce32c6007eb$export$fedb369cb70207f1)() || segment.type === 'timeZoneName' ? {
        role: 'textbox',
        'aria-valuemax': null,
        'aria-valuemin': null,
        'aria-valuetext': null,
        'aria-valuenow': null
    } : {};
    // Only apply aria-describedby to the first segment, unless the field is invalid. This avoids it being
    // read every time the user navigates to a new segment.
    let firstSegment = (0, $dk9mG$useMemo)(()=>state.segments.find((s)=>s.isEditable), [
        state.segments
    ]);
    if (segment !== firstSegment && !state.isInvalid) ariaDescribedBy = undefined;
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    let isEditable = !state.isDisabled && !state.isReadOnly && segment.isEditable;
    // Prepend the label passed from the field to each segment name.
    // This is needed because VoiceOver on iOS does not announce groups.
    let name = segment.type === 'literal' ? '' : displayNames.of(segment.type);
    let labelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        'aria-label': `${name}${ariaLabel ? `, ${ariaLabel}` : ''}${ariaLabelledBy ? ', ' : ''}`,
        'aria-labelledby': ariaLabelledBy
    });
    // Literal segments should not be visible to screen readers. We don't really need any of the above,
    // but the rules of hooks mean hooks cannot be conditional so we have to put this condition here.
    if (segment.type === 'literal') return {
        segmentProps: {
            'aria-hidden': true
        }
    };
    let segmentStyle = {
        caretColor: 'transparent'
    };
    if (direction === 'rtl') {
        // While the bidirectional algorithm seems to work properly on inline elements with actual values, it returns different results for placeholder strings.
        // To ensure placeholder render in correct format, we apply the CSS equivalent of LRE (left-to-right embedding). See https://www.unicode.org/reports/tr9/#Explicit_Directional_Embeddings.
        // However, we apply this to both placeholders and date segments with an actual value because the date segments will shift around when deleting otherwise.
        segmentStyle.unicodeBidi = 'embed';
        let format = options[segment.type];
        if (format === 'numeric' || format === '2-digit') segmentStyle.direction = 'ltr';
    }
    return {
        segmentProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(spinButtonProps, labelProps, {
            id: id,
            ...touchPropOverrides,
            'aria-invalid': state.isInvalid ? 'true' : undefined,
            'aria-describedby': ariaDescribedBy,
            'aria-readonly': state.isReadOnly || !segment.isEditable ? 'true' : undefined,
            'data-placeholder': segment.isPlaceholder || undefined,
            contentEditable: isEditable,
            suppressContentEditableWarning: isEditable,
            spellCheck: isEditable ? 'false' : undefined,
            autoCorrect: isEditable ? 'off' : undefined,
            // Capitalization was changed in React 17...
            [parseInt((0, $dk9mG$react).version, 10) >= 17 ? 'enterKeyHint' : 'enterkeyhint']: isEditable ? 'next' : undefined,
            inputMode: state.isDisabled || segment.type === 'dayPeriod' || segment.type === 'era' || !isEditable ? undefined : 'numeric',
            tabIndex: state.isDisabled ? undefined : 0,
            onKeyDown: onKeyDown,
            onFocus: onFocus,
            style: segmentStyle,
            // Prevent pointer events from reaching useDatePickerGroup, and allow native browser behavior to focus the segment.
            onPointerDown (e) {
                e.stopPropagation();
            },
            onMouseDown (e) {
                e.stopPropagation();
            }
        })
    };
}
function $d51706f903be7eab$var$commonPrefixLength(strings) {
    // Sort the strings, and compare the characters in the first and last to find the common prefix.
    strings.sort();
    let first = strings[0];
    let last = strings[strings.length - 1];
    for(let i = 0; i < first.length; i++){
        if (first[i] !== last[i]) return i;
    }
    return 0;
}


export {$d51706f903be7eab$export$1315d136e6f7581 as useDateSegment};
//# sourceMappingURL=useDateSegment.mjs.map
