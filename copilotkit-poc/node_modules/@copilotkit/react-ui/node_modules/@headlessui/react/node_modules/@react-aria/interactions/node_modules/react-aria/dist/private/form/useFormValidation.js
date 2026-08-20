import {getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {setInteractionModality as $b50b1cc8a843ace7$export$8397ddfc504fdb9a} from "../interactions/useFocusVisible.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useLayoutEffect as $53fed047b798be36$export$e5c5a5f917a5871c} from "../utils/useLayoutEffect.js";
import {useRef as $auk5t$useRef, useEffect as $auk5t$useEffect} from "react";

/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 




function $3bea40a930a50ce5$export$b8473d3665f3a75a(props, state, ref) {
    let { validationBehavior: validationBehavior, focus: focus } = props;
    // This is a useLayoutEffect so that it runs before the useEffect in useFormValidationState, which commits the validation change.
    (0, $53fed047b798be36$export$e5c5a5f917a5871c)(()=>{
        if (validationBehavior === 'native' && (ref === null || ref === void 0 ? void 0 : ref.current) && !ref.current.disabled) {
            let errorMessage = state.realtimeValidation.isInvalid ? state.realtimeValidation.validationErrors.join(' ') || 'Invalid value.' : '';
            ref.current.setCustomValidity(errorMessage);
            // Prevent default tooltip for validation message.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=605277
            if (!ref.current.hasAttribute('title')) ref.current.title = '';
            if (!state.realtimeValidation.isInvalid) state.updateValidation($3bea40a930a50ce5$var$getNativeValidity(ref.current));
        }
    });
    let isIgnoredReset = (0, $auk5t$useRef)(false);
    let onReset = (0, $85567ef950781b7d$export$7f54fc3180508a52)(()=>{
        if (!isIgnoredReset.current) state.resetValidation();
    });
    let onInvalid = (0, $85567ef950781b7d$export$7f54fc3180508a52)((e)=>{
        var _ref_current;
        // Only commit validation if we are not already displaying one.
        // This avoids clearing server errors that the user didn't actually fix.
        if (!state.displayValidation.isInvalid) state.commitValidation();
        // Auto focus the first invalid input in a form, unless the error already had its default prevented.
        let form = ref === null || ref === void 0 ? void 0 : (_ref_current = ref.current) === null || _ref_current === void 0 ? void 0 : _ref_current.form;
        if (!e.defaultPrevented && ref && form && $3bea40a930a50ce5$var$getFirstInvalidInput(form) === ref.current) {
            var _ref_current1;
            if (focus) focus();
            else (_ref_current1 = ref.current) === null || _ref_current1 === void 0 ? void 0 : _ref_current1.focus();
            // Always show focus ring.
            (0, $b50b1cc8a843ace7$export$8397ddfc504fdb9a)('keyboard');
        }
        // Prevent default browser error UI from appearing.
        e.preventDefault();
    });
    let onChange = (0, $85567ef950781b7d$export$7f54fc3180508a52)(()=>{
        state.commitValidation();
    });
    (0, $auk5t$useEffect)(()=>{
        let input = ref === null || ref === void 0 ? void 0 : ref.current;
        if (!input) return;
        let form = input.form;
        let reset = form === null || form === void 0 ? void 0 : form.reset;
        if (form) // Try to detect React's automatic form reset behavior so we don't clear
        // validation errors that are returned by server actions.
        // To do this, we ignore programmatic form resets that occur outside a user event.
        // This is best-effort. There may be false positives, e.g. setTimeout.
        form.reset = ()=>{
            // React uses MessageChannel for scheduling, so ignore 'message' events.
            isIgnoredReset.current = !window.event || window.event.type === 'message' && (0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(window.event) instanceof MessagePort;
            reset === null || reset === void 0 ? void 0 : reset.call(form);
            isIgnoredReset.current = false;
        };
        input.addEventListener('invalid', onInvalid);
        input.addEventListener('change', onChange);
        form === null || form === void 0 ? void 0 : form.addEventListener('reset', onReset);
        return ()=>{
            input.removeEventListener('invalid', onInvalid);
            input.removeEventListener('change', onChange);
            form === null || form === void 0 ? void 0 : form.removeEventListener('reset', onReset);
            if (form) // @ts-ignore
            form.reset = reset;
        };
    }, [
        ref,
        validationBehavior
    ]);
}
function $3bea40a930a50ce5$var$getValidity(input) {
    // The native ValidityState object is live, meaning each property is a getter that returns the current state.
    // We need to create a snapshot of the validity state at the time this function is called to avoid unpredictable React renders.
    let validity = input.validity;
    return {
        badInput: validity.badInput,
        customError: validity.customError,
        patternMismatch: validity.patternMismatch,
        rangeOverflow: validity.rangeOverflow,
        rangeUnderflow: validity.rangeUnderflow,
        stepMismatch: validity.stepMismatch,
        tooLong: validity.tooLong,
        tooShort: validity.tooShort,
        typeMismatch: validity.typeMismatch,
        valueMissing: validity.valueMissing,
        valid: validity.valid
    };
}
function $3bea40a930a50ce5$var$getNativeValidity(input) {
    return {
        isInvalid: !input.validity.valid,
        validationDetails: $3bea40a930a50ce5$var$getValidity(input),
        validationErrors: input.validationMessage ? [
            input.validationMessage
        ] : []
    };
}
function $3bea40a930a50ce5$var$getFirstInvalidInput(form) {
    for(let i = 0; i < form.elements.length; i++){
        var _element_validity;
        let element = form.elements[i];
        if (((_element_validity = element.validity) === null || _element_validity === void 0 ? void 0 : _element_validity.valid) === false) return element;
    }
    return null;
}


export {$3bea40a930a50ce5$export$b8473d3665f3a75a as useFormValidation};
//# sourceMappingURL=useFormValidation.js.map
