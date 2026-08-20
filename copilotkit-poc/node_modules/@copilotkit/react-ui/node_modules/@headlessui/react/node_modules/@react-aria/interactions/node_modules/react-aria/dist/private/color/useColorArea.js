import {focusWithoutScrolling as $d559d872031c749f$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.js";
import $fI39H$intlStringsjs from "./intlStrings.js";
import {isAndroid as $d5a2be505488529f$export$a11b0059900ceec8, isIOS as $d5a2be505488529f$export$fedb369cb70207f1} from "../utils/platform.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useColorAreaGradient as $de466720b9514fd4$export$dd62420467d245ca} from "./useColorAreaGradient.js";
import {useFocus as $a19d0c473b0e0cad$export$f8168d8dd8fd66e6} from "../interactions/useFocus.js";
import {useFocusWithin as $b842b95ed9b5d4d5$export$420e68273165f4ec} from "../interactions/useFocusWithin.js";
import {useFormReset as $5dfd40f1661a7fc3$export$5add1d006293d136} from "../utils/useFormReset.js";
import {useGlobalListeners as $0d742958be022209$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.js";
import {useKeyboard as $bf74df7506f65576$export$8f71654801c2f7cd} from "../interactions/useKeyboard.js";
import {useLabels as $93a7fe14591f425f$export$d6875122194c7b44} from "../utils/useLabels.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useMove as $e7c7f5ffbc8157af$export$36da96379f79f245} from "../interactions/useMove.js";
import {useVisuallyHidden as $6947385881e3ae0e$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.js";
import {useState as $fI39H$useState, useCallback as $fI39H$useCallback, useRef as $fI39H$useRef} from "react";


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















function $9e8e53809a0bcfb8$export$2f92a7a615a014f6(props, state) {
    let { isDisabled: isDisabled, inputXRef: inputXRef, inputYRef: inputYRef, containerRef: containerRef, 'aria-label': ariaLabel, xName: xName, yName: yName, form: form } = props;
    let stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($fI39H$intlStringsjs))), '@react-aria/color');
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $0d742958be022209$export$4eaf04e54aa8eed6)();
    let { direction: direction, locale: locale } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let [focusedInput, setFocusedInput] = (0, $fI39H$useState)(null);
    let focusInput = (0, $fI39H$useCallback)((inputRef = inputXRef)=>{
        if (inputRef.current) (0, $d559d872031c749f$export$de79e2c695e052f3)(inputRef.current);
    }, [
        inputXRef
    ]);
    (0, $5dfd40f1661a7fc3$export$5add1d006293d136)(inputXRef, state.defaultValue, state.setValue);
    let [valueChangedViaKeyboard, setValueChangedViaKeyboard] = (0, $fI39H$useState)(false);
    let [valueChangedViaInputChangeEvent, setValueChangedViaInputChangeEvent] = (0, $fI39H$useState)(false);
    let { xChannel: xChannel, yChannel: yChannel, zChannel: zChannel } = state.channels;
    let xChannelStep = state.xChannelStep;
    let yChannelStep = state.yChannelStep;
    let currentPosition = (0, $fI39H$useRef)(null);
    let { keyboardProps: keyboardProps } = (0, $bf74df7506f65576$export$8f71654801c2f7cd)({
        onKeyDown (e) {
            // these are the cases that useMove doesn't handle
            if (!/^(PageUp|PageDown|Home|End)$/.test(e.key)) {
                e.continuePropagation();
                return;
            }
            // same handling as useMove, don't need to stop propagation, useKeyboard will do that for us
            e.preventDefault();
            // remember to set this and unset it so that onChangeEnd is fired
            state.setDragging(true);
            setValueChangedViaKeyboard(true);
            let dir;
            switch(e.key){
                case 'PageUp':
                    state.incrementY(state.yChannelPageStep);
                    dir = 'y';
                    break;
                case 'PageDown':
                    state.decrementY(state.yChannelPageStep);
                    dir = 'y';
                    break;
                case 'Home':
                    direction === 'rtl' ? state.incrementX(state.xChannelPageStep) : state.decrementX(state.xChannelPageStep);
                    dir = 'x';
                    break;
                case 'End':
                    direction === 'rtl' ? state.decrementX(state.xChannelPageStep) : state.incrementX(state.xChannelPageStep);
                    dir = 'x';
                    break;
            }
            state.setDragging(false);
            if (dir) {
                let input = dir === 'x' ? inputXRef : inputYRef;
                focusInput(input);
                setFocusedInput(dir);
            }
        }
    });
    let moveHandler = {
        onMoveStart () {
            currentPosition.current = null;
            state.setDragging(true);
        },
        onMove ({ deltaX: deltaX, deltaY: deltaY, pointerType: pointerType, shiftKey: shiftKey }) {
            var _containerRef_current;
            let { incrementX: incrementX, decrementX: decrementX, incrementY: incrementY, decrementY: decrementY, xChannelPageStep: xChannelPageStep, xChannelStep: xChannelStep, yChannelPageStep: yChannelPageStep, yChannelStep: yChannelStep, getThumbPosition: getThumbPosition, setColorFromPoint: setColorFromPoint } = state;
            if (currentPosition.current == null) currentPosition.current = getThumbPosition();
            let { width: width, height: height } = ((_containerRef_current = containerRef.current) === null || _containerRef_current === void 0 ? void 0 : _containerRef_current.getBoundingClientRect()) || {
                width: 0,
                height: 0
            };
            let valueChanged = deltaX !== 0 || deltaY !== 0;
            if (pointerType === 'keyboard') {
                let deltaXValue = shiftKey && xChannelPageStep > xChannelStep ? xChannelPageStep : xChannelStep;
                let deltaYValue = shiftKey && yChannelPageStep > yChannelStep ? yChannelPageStep : yChannelStep;
                if (deltaX > 0 && direction === 'ltr' || deltaX < 0 && direction === 'rtl') incrementX(deltaXValue);
                else if (deltaX < 0 && direction === 'ltr' || deltaX > 0 && direction === 'rtl') decrementX(deltaXValue);
                else if (deltaY > 0) decrementY(deltaYValue);
                else if (deltaY < 0) incrementY(deltaYValue);
                setValueChangedViaKeyboard(valueChanged);
                // set the focused input based on which axis has the greater delta
                focusedInput = valueChanged && Math.abs(deltaY) > Math.abs(deltaX) ? 'y' : 'x';
                setFocusedInput(focusedInput);
            } else {
                currentPosition.current.x += (direction === 'rtl' ? -1 : 1) * deltaX / width;
                currentPosition.current.y += deltaY / height;
                setColorFromPoint(currentPosition.current.x, currentPosition.current.y);
            }
        },
        onMoveEnd () {
            isOnColorArea.current = false;
            state.setDragging(false);
            let input = focusedInput === 'x' ? inputXRef : inputYRef;
            focusInput(input);
        }
    };
    let { moveProps: movePropsThumb } = (0, $e7c7f5ffbc8157af$export$36da96379f79f245)(moveHandler);
    let { focusWithinProps: focusWithinProps } = (0, $b842b95ed9b5d4d5$export$420e68273165f4ec)({
        onFocusWithinChange: (focusWithin)=>{
            if (!focusWithin) {
                setValueChangedViaKeyboard(false);
                setValueChangedViaInputChangeEvent(false);
            }
        }
    });
    let currentPointer = (0, $fI39H$useRef)(undefined);
    let isOnColorArea = (0, $fI39H$useRef)(false);
    let { moveProps: movePropsContainer } = (0, $e7c7f5ffbc8157af$export$36da96379f79f245)({
        onMoveStart () {
            if (isOnColorArea.current) moveHandler.onMoveStart();
        },
        onMove (e) {
            if (isOnColorArea.current) moveHandler.onMove(e);
        },
        onMoveEnd () {
            if (isOnColorArea.current) moveHandler.onMoveEnd();
        }
    });
    let onThumbDown = (id)=>{
        if (!state.isDragging) {
            currentPointer.current = id;
            setValueChangedViaKeyboard(false);
            focusInput();
            state.setDragging(true);
            if (typeof PointerEvent !== 'undefined') addGlobalListener(window, 'pointerup', onThumbUp, false);
            else {
                addGlobalListener(window, 'mouseup', onThumbUp, false);
                addGlobalListener(window, 'touchend', onThumbUp, false);
            }
        }
    };
    let onThumbUp = (e)=>{
        var _e_changedTouches;
        var _e_pointerId;
        let id = (_e_pointerId = e.pointerId) !== null && _e_pointerId !== void 0 ? _e_pointerId : (_e_changedTouches = e.changedTouches) === null || _e_changedTouches === void 0 ? void 0 : _e_changedTouches[0].identifier;
        if (id === currentPointer.current) {
            setValueChangedViaKeyboard(false);
            focusInput();
            state.setDragging(false);
            currentPointer.current = undefined;
            isOnColorArea.current = false;
            if (typeof PointerEvent !== 'undefined') removeGlobalListener(window, 'pointerup', onThumbUp, false);
            else {
                removeGlobalListener(window, 'mouseup', onThumbUp, false);
                removeGlobalListener(window, 'touchend', onThumbUp, false);
            }
        }
    };
    let onColorAreaDown = (colorArea, id, clientX, clientY)=>{
        let rect = colorArea.getBoundingClientRect();
        let { width: width, height: height } = rect;
        let x = (clientX - rect.x) / width;
        let y = (clientY - rect.y) / height;
        if (direction === 'rtl') x = 1 - x;
        if (x >= 0 && x <= 1 && y >= 0 && y <= 1 && !state.isDragging && currentPointer.current === undefined) {
            isOnColorArea.current = true;
            setValueChangedViaKeyboard(false);
            currentPointer.current = id;
            state.setColorFromPoint(x, y);
            focusInput();
            state.setDragging(true);
            if (typeof PointerEvent !== 'undefined') addGlobalListener(window, 'pointerup', onColorAreaUp, false);
            else {
                addGlobalListener(window, 'mouseup', onColorAreaUp, false);
                addGlobalListener(window, 'touchend', onColorAreaUp, false);
            }
        }
    };
    let onColorAreaUp = (e)=>{
        var _e_changedTouches;
        var _e_pointerId;
        let id = (_e_pointerId = e.pointerId) !== null && _e_pointerId !== void 0 ? _e_pointerId : (_e_changedTouches = e.changedTouches) === null || _e_changedTouches === void 0 ? void 0 : _e_changedTouches[0].identifier;
        if (isOnColorArea.current && id === currentPointer.current) {
            isOnColorArea.current = false;
            setValueChangedViaKeyboard(false);
            currentPointer.current = undefined;
            state.setDragging(false);
            focusInput();
            if (typeof PointerEvent !== 'undefined') removeGlobalListener(window, 'pointerup', onColorAreaUp, false);
            else {
                removeGlobalListener(window, 'mouseup', onColorAreaUp, false);
                removeGlobalListener(window, 'touchend', onColorAreaUp, false);
            }
        }
    };
    let colorAreaInteractions = isDisabled ? {} : (0, $64c36edd757dfa16$export$9d1611c77c2fe928)({
        ...typeof PointerEvent !== 'undefined' ? {
            onPointerDown: (e)=>{
                if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onColorAreaDown(e.currentTarget, e.pointerId, e.clientX, e.clientY);
            }
        } : {
            onMouseDown: (e)=>{
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onColorAreaDown(e.currentTarget, undefined, e.clientX, e.clientY);
            },
            onTouchStart: (e)=>{
                onColorAreaDown(e.currentTarget, e.changedTouches[0].identifier, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        }
    }, movePropsContainer);
    let thumbInteractions = isDisabled ? {} : (0, $64c36edd757dfa16$export$9d1611c77c2fe928)({
        ...typeof PointerEvent !== 'undefined' ? {
            onPointerDown: (e)=>{
                if (e.pointerType === 'mouse' && (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey)) return;
                onThumbDown(e.pointerId);
            }
        } : {
            onMouseDown: (e)=>{
                if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
                onThumbDown(undefined);
            },
            onTouchStart: (e)=>{
                onThumbDown(e.changedTouches[0].identifier);
            }
        }
    }, focusWithinProps, keyboardProps, movePropsThumb);
    let { focusProps: xInputFocusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)({
        onFocus: ()=>{
            setFocusedInput('x');
        }
    });
    let { focusProps: yInputFocusProps } = (0, $a19d0c473b0e0cad$export$f8168d8dd8fd66e6)({
        onFocus: ()=>{
            setFocusedInput('y');
        }
    });
    const onChange = (e)=>{
        const { target: target } = e;
        setValueChangedViaInputChangeEvent(true);
        if (target === inputXRef.current) state.setXValue(parseFloat(target.value));
        else if (target === inputYRef.current) state.setYValue(parseFloat(target.value));
    };
    let isMobile = (0, $d5a2be505488529f$export$fedb369cb70207f1)() || (0, $d5a2be505488529f$export$a11b0059900ceec8)();
    let value = state.getDisplayColor();
    const getAriaValueTextForChannel = (0, $fI39H$useCallback)((channel)=>{
        const isAfterInput = valueChangedViaInputChangeEvent || valueChangedViaKeyboard;
        return `${isAfterInput ? stringFormatter.format('colorNameAndValue', {
            name: value.getChannelName(channel, locale),
            value: value.formatChannelValue(channel, locale)
        }) : [
            stringFormatter.format('colorNameAndValue', {
                name: value.getChannelName(channel, locale),
                value: value.formatChannelValue(channel, locale)
            }),
            stringFormatter.format('colorNameAndValue', {
                name: value.getChannelName(channel === yChannel ? xChannel : yChannel, locale),
                value: value.formatChannelValue(channel === yChannel ? xChannel : yChannel, locale)
            }),
            stringFormatter.format('colorNameAndValue', {
                name: value.getChannelName(zChannel, locale),
                value: value.formatChannelValue(zChannel, locale)
            })
        ].join(', ')}, ${value.getColorName(locale)}`;
    }, [
        locale,
        value,
        stringFormatter,
        valueChangedViaInputChangeEvent,
        valueChangedViaKeyboard,
        xChannel,
        yChannel,
        zChannel
    ]);
    let colorPickerLabel = stringFormatter.format('colorPicker');
    let xInputLabellingProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? stringFormatter.format('colorInputLabel', {
            label: ariaLabel,
            channelLabel: colorPickerLabel
        }) : colorPickerLabel
    });
    let yInputLabellingProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? stringFormatter.format('colorInputLabel', {
            label: ariaLabel,
            channelLabel: colorPickerLabel
        }) : colorPickerLabel
    });
    let colorAreaLabellingProps = (0, $93a7fe14591f425f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? `${ariaLabel}, ${colorPickerLabel}` : undefined
    }, isMobile ? colorPickerLabel : undefined);
    let ariaRoleDescription = stringFormatter.format('twoDimensionalSlider');
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $6947385881e3ae0e$export$a966af930f325cab)({
        style: {
            opacity: '0.0001',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        }
    });
    let { colorAreaStyleProps: colorAreaStyleProps, thumbStyleProps: thumbStyleProps } = (0, $de466720b9514fd4$export$dd62420467d245ca)({
        direction: direction,
        state: state,
        xChannel: xChannel,
        yChannel: yChannel,
        zChannel: zChannel
    });
    return {
        colorAreaProps: {
            ...colorAreaLabellingProps,
            ...colorAreaInteractions,
            ...colorAreaStyleProps,
            role: 'group'
        },
        thumbProps: {
            ...thumbInteractions,
            ...thumbStyleProps,
            role: 'presentation'
        },
        xInputProps: {
            ...xInputLabellingProps,
            ...visuallyHiddenProps,
            ...xInputFocusProps,
            type: 'range',
            min: state.value.getChannelRange(xChannel).minValue,
            max: state.value.getChannelRange(xChannel).maxValue,
            step: xChannelStep,
            'aria-roledescription': ariaRoleDescription,
            'aria-valuetext': getAriaValueTextForChannel(xChannel),
            'aria-orientation': 'horizontal',
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details'],
            disabled: isDisabled,
            value: state.value.getChannelValue(xChannel),
            name: xName,
            form: form,
            tabIndex: isMobile || !focusedInput || focusedInput === 'x' ? undefined : -1,
            /*
        So that only a single "2d slider" control shows up when listing form elements for screen readers,
        add aria-hidden="true" to the unfocused control when the value has not changed via the keyboard,
        but remove aria-hidden to reveal the input for each channel when the value has changed with the keyboard.
      */ 'aria-hidden': isMobile || !focusedInput || focusedInput === 'x' || valueChangedViaKeyboard ? undefined : 'true',
            onChange: onChange
        },
        yInputProps: {
            ...yInputLabellingProps,
            ...visuallyHiddenProps,
            ...yInputFocusProps,
            type: 'range',
            min: state.value.getChannelRange(yChannel).minValue,
            max: state.value.getChannelRange(yChannel).maxValue,
            step: yChannelStep,
            'aria-roledescription': ariaRoleDescription,
            'aria-valuetext': getAriaValueTextForChannel(yChannel),
            'aria-orientation': 'vertical',
            'aria-describedby': props['aria-describedby'],
            'aria-details': props['aria-details'],
            disabled: isDisabled,
            value: state.value.getChannelValue(yChannel),
            name: yName,
            form: form,
            tabIndex: isMobile || focusedInput === 'y' ? undefined : -1,
            /*
        So that only a single "2d slider" control shows up when listing form elements for screen readers,
        add aria-hidden="true" to the unfocused input when the value has not changed via the keyboard,
        but remove aria-hidden to reveal the input for each channel when the value has changed with the keyboard.
      */ 'aria-hidden': isMobile || focusedInput === 'y' || valueChangedViaKeyboard ? undefined : 'true',
            onChange: onChange
        }
    };
}


export {$9e8e53809a0bcfb8$export$2f92a7a615a014f6 as useColorArea};
//# sourceMappingURL=useColorArea.js.map
