import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, nodeContains as $d8ac7ed472840322$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.js";
import {getScrollParent as $5b46e0a1626c2890$export$cfa2225e87938781} from "../utils/getScrollParent.js";
import {hookData as $5e49eec2a9af6334$export$653eddfc964b0f8a} from "./useDateField.js";
import {isIOS as $d5a2be505488529f$export$fedb369cb70207f1, isMac as $d5a2be505488529f$export$9ac100e40613ea10} from "../utils/platform.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {scrollIntoViewport as $6507765bd7f5ad94$export$c826860796309d1b} from "../utils/scrollIntoView.js";
import {useDateFormatter as $7673fcc607ba3f7f$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.js";
import {useDisplayNames as $d450be8b38bba6ef$export$d42c60378c8168f8} from "./useDisplayNames.js";
import {useEvent as $c3cab330536504ec$export$90fc3a17d93f704c} from "../utils/useEvent.js";
import {useFilter as $b0c7dfd427914086$export$3274cf84b703fff} from "../i18n/useFilter.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useSpinButton as $b36f0efc8d77b16f$export$e908e06f4b8e3402} from "../spinbutton/useSpinButton.js";
import {toCalendar as $4C1xF$toCalendar, CalendarDate as $4C1xF$CalendarDate} from "@internationalized/date";
import {NumberParser as $4C1xF$NumberParser} from "@internationalized/number";
import $4C1xF$react, {useRef as $4C1xF$useRef, useMemo as $4C1xF$useMemo} from "react";

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

















function $188d623c8ffeadec$export$1315d136e6f7581(segment, state, ref) {
    let enteredKeys = (0, $4C1xF$useRef)('');
    let { locale: locale, direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let displayNames = (0, $d450be8b38bba6ef$export$d42c60378c8168f8)();
    let { ariaLabel: ariaLabel, ariaLabelledBy: ariaLabelledBy, ariaDescribedBy: ariaDescribedBy, focusManager: focusManager } = (0, $5e49eec2a9af6334$export$653eddfc964b0f8a).get(state);
    let textValue = segment.isPlaceholder ? '' : segment.text;
    let options = (0, $4C1xF$useMemo)(()=>state.dateFormatter.resolvedOptions(), [
        state.dateFormatter
    ]);
    let monthDateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        month: 'long',
        timeZone: options.timeZone
    });
    let hourDateFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        hour: 'numeric',
        hour12: options.hour12,
        timeZone: options.timeZone
    });
    if (segment.type === 'month' && !segment.isPlaceholder) {
        let monthTextValue = monthDateFormatter.format(state.dateValue);
        textValue = monthTextValue !== textValue ? `${textValue} \u{2013} ${monthTextValue}` : monthTextValue;
    } else if (segment.type === 'hour' && !segment.isPlaceholder) textValue = hourDateFormatter.format(state.dateValue);
    var _segment_value;
    let { spinButtonProps: spinButtonProps } = (0, $b36f0efc8d77b16f$export$e908e06f4b8e3402)({
        // The ARIA spec says aria-valuenow is optional if there's no value, but aXe seems to require it.
        // This doesn't seem to have any negative effects with real AT since we also use aria-valuetext.
        // https://github.com/dequelabs/axe-core/issues/3505
        value: (_segment_value = segment.value) !== null && _segment_value !== void 0 ? _segment_value : undefined,
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
    let parser = (0, $4C1xF$useMemo)(()=>new (0, $4C1xF$NumberParser)(locale, {
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
        if (e.key === 'a' && ((0, $d5a2be505488529f$export$9ac100e40613ea10)() ? e.metaKey : e.ctrlKey)) e.preventDefault();
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
    let { startsWith: startsWith } = (0, $b0c7dfd427914086$export$3274cf84b703fff)({
        sensitivity: 'base'
    });
    let amPmFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        hour: 'numeric',
        hour12: true
    });
    let am = (0, $4C1xF$useMemo)(()=>{
        let date = new Date();
        date.setHours(0);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === 'dayPeriod').value;
    }, [
        amPmFormatter
    ]);
    let pm = (0, $4C1xF$useMemo)(()=>{
        let date = new Date();
        date.setHours(12);
        return amPmFormatter.formatToParts(date).find((part)=>part.type === 'dayPeriod').value;
    }, [
        amPmFormatter
    ]);
    // Get a list of formatted era names so users can type the first character to choose one.
    let eraFormatter = (0, $7673fcc607ba3f7f$export$85fd5fdf27bacc79)({
        year: 'numeric',
        era: 'narrow',
        timeZone: 'UTC'
    });
    let eras = (0, $4C1xF$useMemo)(()=>{
        if (segment.type !== 'era') return [];
        let date = (0, $4C1xF$toCalendar)(new (0, $4C1xF$CalendarDate)(1, 1, 1), state.calendar);
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
        let prefixLength = $188d623c8ffeadec$var$commonPrefixLength(eras.map((era)=>era.formatted));
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
        if (ref.current) (0, $6507765bd7f5ad94$export$c826860796309d1b)(ref.current, {
            containingElement: (0, $5b46e0a1626c2890$export$cfa2225e87938781)(ref.current)
        });
        // Collapse selection to start or Chrome won't fire input events.
        let selection = window.getSelection();
        selection === null || selection === void 0 ? void 0 : selection.collapse(ref.current);
    };
    let documentRef = (0, $4C1xF$useRef)(typeof document !== 'undefined' ? document : null);
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(documentRef, 'selectionchange', ()=>{
        // Enforce that the selection is collapsed when inside a date segment.
        // Otherwise, when tapping on a segment in Android Chrome and then entering text,
        // composition events will be fired that break the DOM structure and crash the page.
        let selection = window.getSelection();
        if ((selection === null || selection === void 0 ? void 0 : selection.anchorNode) && (0, $d8ac7ed472840322$export$4282f70798064fe0)(ref.current, selection === null || selection === void 0 ? void 0 : selection.anchorNode)) selection.collapse(ref.current);
    });
    let compositionRef = (0, $4C1xF$useRef)('');
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, 'beforeinput', (e)=>{
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
    (0, $c3cab330536504ec$export$90fc3a17d93f704c)(ref, 'input', (e)=>{
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
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        let element = ref.current;
        return ()=>{
            // If the focused segment is removed, focus the previous one, or the next one if there was no previous one.
            if ((0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === element) {
                let prev = focusManager.focusPrevious();
                if (!prev) focusManager.focusNext();
            }
        };
    }, [
        ref,
        focusManager
    ]);
    // spinbuttons cannot be focused with VoiceOver on iOS.
    let touchPropOverrides = (0, $d5a2be505488529f$export$fedb369cb70207f1)() || segment.type === 'timeZoneName' ? {
        role: 'textbox',
        'aria-valuemax': null,
        'aria-valuemin': null,
        'aria-valuetext': null,
        'aria-valuenow': null
    } : {};
    // Only apply aria-describedby to the first segment, unless the field is invalid. This avoids it being
    // read every time the user navigates to a new segment.
    let firstSegment = (0, $4C1xF$useMemo)(()=>state.segments.find((s)=>s.isEditable), [
        state.segments
    ]);
    if (segment !== firstSegment && !state.isInvalid) ariaDescribedBy = undefined;
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let isEditable = !state.isDisabled && !state.isReadOnly && segment.isEditable;
    // Prepend the label passed from the field to each segment name.
    // This is needed because VoiceOver on iOS does not announce groups.
    let name = segment.type === 'literal' ? '' : displayNames.of(segment.type);
    let labelProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
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
        segmentProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(spinButtonProps, labelProps, {
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
            [parseInt((0, $4C1xF$react).version, 10) >= 17 ? 'enterKeyHint' : 'enterkeyhint']: isEditable ? 'next' : undefined,
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
function $188d623c8ffeadec$var$commonPrefixLength(strings) {
    // Sort the strings, and compare the characters in the first and last to find the common prefix.
    strings.sort();
    let first = strings[0];
    let last = strings[strings.length - 1];
    for(let i = 0; i < first.length; i++){
        if (first[i] !== last[i]) return i;
    }
    return 0;
}


export {$188d623c8ffeadec$export$1315d136e6f7581 as useDateSegment};
//# sourceMappingURL=useDateSegment.js.map
