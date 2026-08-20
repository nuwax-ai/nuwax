import {createContext as $8AuPP$createContext, useMemo as $8AuPP$useMemo, useContext as $8AuPP$useContext, useState as $8AuPP$useState, useRef as $8AuPP$useRef, useEffect as $8AuPP$useEffect} from "react";

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
const $fd2148440a13ec26$export$aca958c65c314e6c = {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valueMissing: false,
    valid: true
};
const $fd2148440a13ec26$var$CUSTOM_VALIDITY_STATE = {
    ...$fd2148440a13ec26$export$aca958c65c314e6c,
    customError: true,
    valid: false
};
const $fd2148440a13ec26$export$dad6ae84456c676a = {
    isInvalid: false,
    validationDetails: $fd2148440a13ec26$export$aca958c65c314e6c,
    validationErrors: []
};
const $fd2148440a13ec26$export$571b5131b7e65c11 = (0, $8AuPP$createContext)({});
const $fd2148440a13ec26$export$a763b9476acd3eb = '__reactAriaFormValidationState';
function $fd2148440a13ec26$export$fc1a364ae1f3ff10(props) {
    // Private prop for parent components to pass state to children.
    if (props[$fd2148440a13ec26$export$a763b9476acd3eb]) {
        let { realtimeValidation: realtimeValidation, displayValidation: displayValidation, updateValidation: updateValidation, resetValidation: resetValidation, commitValidation: commitValidation } = props[$fd2148440a13ec26$export$a763b9476acd3eb];
        return {
            realtimeValidation: realtimeValidation,
            displayValidation: displayValidation,
            updateValidation: updateValidation,
            resetValidation: resetValidation,
            commitValidation: commitValidation
        };
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return $fd2148440a13ec26$var$useFormValidationStateImpl(props);
}
function $fd2148440a13ec26$var$useFormValidationStateImpl(props) {
    let { isInvalid: isInvalid, validationState: validationState, name: name, value: value, builtinValidation: builtinValidation, validate: validate, validationBehavior: validationBehavior = 'aria' } = props;
    // backward compatibility.
    if (validationState) isInvalid ||= validationState === 'invalid';
    // If the isInvalid prop is controlled, update validation result in realtime.
    let controlledError = isInvalid !== undefined ? {
        isInvalid: isInvalid,
        validationErrors: [],
        validationDetails: $fd2148440a13ec26$var$CUSTOM_VALIDITY_STATE
    } : null;
    // Perform custom client side validation.
    let clientError = (0, $8AuPP$useMemo)(()=>{
        if (!validate || value == null) return null;
        let validateErrors = $fd2148440a13ec26$var$runValidate(validate, value);
        return $fd2148440a13ec26$var$getValidationResult(validateErrors);
    }, [
        validate,
        value
    ]);
    if (builtinValidation?.validationDetails.valid) builtinValidation = undefined;
    // Get relevant server errors from the form.
    let serverErrors = (0, $8AuPP$useContext)($fd2148440a13ec26$export$571b5131b7e65c11);
    let serverErrorMessages = (0, $8AuPP$useMemo)(()=>{
        if (name) return Array.isArray(name) ? name.flatMap((name)=>$fd2148440a13ec26$var$asArray(serverErrors[name])) : $fd2148440a13ec26$var$asArray(serverErrors[name]);
        return [];
    }, [
        serverErrors,
        name
    ]);
    // Show server errors when the form gets a new value, and clear when the user changes the value.
    let [lastServerErrors, setLastServerErrors] = (0, $8AuPP$useState)(serverErrors);
    let [isServerErrorCleared, setServerErrorCleared] = (0, $8AuPP$useState)(false);
    if (serverErrors !== lastServerErrors) {
        setLastServerErrors(serverErrors);
        setServerErrorCleared(false);
    }
    let serverError = (0, $8AuPP$useMemo)(()=>$fd2148440a13ec26$var$getValidationResult(isServerErrorCleared ? [] : serverErrorMessages), [
        isServerErrorCleared,
        serverErrorMessages
    ]);
    // Track the next validation state in a ref until commitValidation is called.
    let nextValidation = (0, $8AuPP$useRef)($fd2148440a13ec26$export$dad6ae84456c676a);
    let [currentValidity, setCurrentValidity] = (0, $8AuPP$useState)($fd2148440a13ec26$export$dad6ae84456c676a);
    let lastError = (0, $8AuPP$useRef)($fd2148440a13ec26$export$dad6ae84456c676a);
    let commitValidation = ()=>{
        if (!commitQueued) return;
        setCommitQueued(false);
        let error = clientError || builtinValidation || nextValidation.current;
        if (!$fd2148440a13ec26$var$isEqualValidation(error, lastError.current)) {
            lastError.current = error;
            setCurrentValidity(error);
        }
    };
    let [commitQueued, setCommitQueued] = (0, $8AuPP$useState)(false);
    (0, $8AuPP$useEffect)(commitValidation);
    // realtimeValidation is used to update the native input element's state based on custom validation logic.
    // displayValidation is the currently displayed validation state that the user sees (e.g. on input change/form submit).
    // With validationBehavior="aria", all errors are displayed in realtime rather than on submit.
    let realtimeValidation = controlledError || serverError || clientError || builtinValidation || $fd2148440a13ec26$export$dad6ae84456c676a;
    let displayValidation = validationBehavior === 'native' ? controlledError || serverError || currentValidity : controlledError || serverError || clientError || builtinValidation || currentValidity;
    return {
        realtimeValidation: realtimeValidation,
        displayValidation: displayValidation,
        updateValidation (value) {
            // If validationBehavior is 'aria', update in realtime. Otherwise, store in a ref until commit.
            if (validationBehavior === 'aria' && !$fd2148440a13ec26$var$isEqualValidation(currentValidity, value)) setCurrentValidity(value);
            else nextValidation.current = value;
        },
        resetValidation () {
            // Update the currently displayed validation state to valid on form reset,
            // even if the native validity says it isn't. It'll show again on the next form submit.
            let error = $fd2148440a13ec26$export$dad6ae84456c676a;
            if (!$fd2148440a13ec26$var$isEqualValidation(error, lastError.current)) {
                lastError.current = error;
                setCurrentValidity(error);
            }
            // Do not commit validation after the next render. This avoids a condition where
            // useSelect calls commitValidation inside an onReset handler.
            if (validationBehavior === 'native') setCommitQueued(false);
            setServerErrorCleared(true);
        },
        commitValidation () {
            // Commit validation state so the user sees it on blur/change/submit. Also clear any server errors.
            // Wait until after the next render to commit so that the latest value has been validated.
            if (validationBehavior === 'native') setCommitQueued(true);
            setServerErrorCleared(true);
        }
    };
}
function $fd2148440a13ec26$var$asArray(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [
        v
    ];
}
function $fd2148440a13ec26$var$runValidate(validate, value) {
    if (typeof validate === 'function') {
        let e = validate(value);
        if (e && typeof e !== 'boolean') return $fd2148440a13ec26$var$asArray(e);
    }
    return [];
}
function $fd2148440a13ec26$var$getValidationResult(errors) {
    return errors.length ? {
        isInvalid: true,
        validationErrors: errors,
        validationDetails: $fd2148440a13ec26$var$CUSTOM_VALIDITY_STATE
    } : null;
}
function $fd2148440a13ec26$var$isEqualValidation(a, b) {
    if (a === b) return true;
    return !!a && !!b && a.isInvalid === b.isInvalid && a.validationErrors.length === b.validationErrors.length && a.validationErrors.every((a, i)=>a === b.validationErrors[i]) && Object.entries(a.validationDetails).every(([k, v])=>b.validationDetails[k] === v);
}
function $fd2148440a13ec26$export$75ee7c75d68f5b0e(...results) {
    let errors = new Set();
    let isInvalid = false;
    let validationDetails = {
        ...$fd2148440a13ec26$export$aca958c65c314e6c
    };
    for (let v of results){
        for (let e of v.validationErrors)errors.add(e);
        // Only these properties apply for checkboxes.
        isInvalid ||= v.isInvalid;
        for(let key in validationDetails)validationDetails[key] ||= v.validationDetails[key];
    }
    validationDetails.valid = !isInvalid;
    return {
        isInvalid: isInvalid,
        validationErrors: [
            ...errors
        ],
        validationDetails: validationDetails
    };
}


export {$fd2148440a13ec26$export$aca958c65c314e6c as VALID_VALIDITY_STATE, $fd2148440a13ec26$export$dad6ae84456c676a as DEFAULT_VALIDATION_RESULT, $fd2148440a13ec26$export$571b5131b7e65c11 as FormValidationContext, $fd2148440a13ec26$export$a763b9476acd3eb as privateValidationStateProp, $fd2148440a13ec26$export$fc1a364ae1f3ff10 as useFormValidationState, $fd2148440a13ec26$export$75ee7c75d68f5b0e as mergeValidation};
//# sourceMappingURL=useFormValidationState.mjs.map
