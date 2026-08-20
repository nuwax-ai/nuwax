import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import $U6XIH$intlStringsmjs from "./intlStrings.mjs";
import {isAndroid as $2add3ce32c6007eb$export$a11b0059900ceec8, isIOS as $2add3ce32c6007eb$export$fedb369cb70207f1} from "../utils/platform.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useColorAreaGradient as $ad8cc31e40d60e64$export$dd62420467d245ca} from "./useColorAreaGradient.mjs";
import {useFocus as $1e74c67db218ce67$export$f8168d8dd8fd66e6} from "../interactions/useFocus.mjs";
import {useFocusWithin as $2c9edc598a03d523$export$420e68273165f4ec} from "../interactions/useFocusWithin.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMove as $1dfdc54e7eb53ba0$export$36da96379f79f245} from "../interactions/useMove.mjs";
import {useVisuallyHidden as $ea3928288112382f$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.mjs";
import {useState as $U6XIH$useState, useCallback as $U6XIH$useCallback, useRef as $U6XIH$useRef} from "react";


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















function $12db0b624ec2ac09$export$2f92a7a615a014f6(props, state) {
    let { isDisabled: isDisabled, inputXRef: inputXRef, inputYRef: inputYRef, containerRef: containerRef, 'aria-label': ariaLabel, xName: xName, yName: yName, form: form } = props;
    let stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($U6XIH$intlStringsmjs))), '@react-aria/color');
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let { direction: direction, locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let [focusedInput, setFocusedInput] = (0, $U6XIH$useState)(null);
    let focusInput = (0, $U6XIH$useCallback)((inputRef = inputXRef)=>{
        if (inputRef.current) (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(inputRef.current);
    }, [
        inputXRef
    ]);
    (0, $3274bf1495747a7b$export$5add1d006293d136)(inputXRef, state.defaultValue, state.setValue);
    let [valueChangedViaKeyboard, setValueChangedViaKeyboard] = (0, $U6XIH$useState)(false);
    let [valueChangedViaInputChangeEvent, setValueChangedViaInputChangeEvent] = (0, $U6XIH$useState)(false);
    let { xChannel: xChannel, yChannel: yChannel, zChannel: zChannel } = state.channels;
    let xChannelStep = state.xChannelStep;
    let yChannelStep = state.yChannelStep;
    let currentPosition = (0, $U6XIH$useRef)(null);
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
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
            let { incrementX: incrementX, decrementX: decrementX, incrementY: incrementY, decrementY: decrementY, xChannelPageStep: xChannelPageStep, xChannelStep: xChannelStep, yChannelPageStep: yChannelPageStep, yChannelStep: yChannelStep, getThumbPosition: getThumbPosition, setColorFromPoint: setColorFromPoint } = state;
            if (currentPosition.current == null) currentPosition.current = getThumbPosition();
            let { width: width, height: height } = containerRef.current?.getBoundingClientRect() || {
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
    let { moveProps: movePropsThumb } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)(moveHandler);
    let { focusWithinProps: focusWithinProps } = (0, $2c9edc598a03d523$export$420e68273165f4ec)({
        onFocusWithinChange: (focusWithin)=>{
            if (!focusWithin) {
                setValueChangedViaKeyboard(false);
                setValueChangedViaInputChangeEvent(false);
            }
        }
    });
    let currentPointer = (0, $U6XIH$useRef)(undefined);
    let isOnColorArea = (0, $U6XIH$useRef)(false);
    let { moveProps: movePropsContainer } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)({
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
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
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
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
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
    let colorAreaInteractions = isDisabled ? {} : (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)({
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
    let thumbInteractions = isDisabled ? {} : (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)({
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
    let { focusProps: xInputFocusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)({
        onFocus: ()=>{
            setFocusedInput('x');
        }
    });
    let { focusProps: yInputFocusProps } = (0, $1e74c67db218ce67$export$f8168d8dd8fd66e6)({
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
    let isMobile = (0, $2add3ce32c6007eb$export$fedb369cb70207f1)() || (0, $2add3ce32c6007eb$export$a11b0059900ceec8)();
    let value = state.getDisplayColor();
    const getAriaValueTextForChannel = (0, $U6XIH$useCallback)((channel)=>{
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
    let xInputLabellingProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? stringFormatter.format('colorInputLabel', {
            label: ariaLabel,
            channelLabel: colorPickerLabel
        }) : colorPickerLabel
    });
    let yInputLabellingProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? stringFormatter.format('colorInputLabel', {
            label: ariaLabel,
            channelLabel: colorPickerLabel
        }) : colorPickerLabel
    });
    let colorAreaLabellingProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        ...props,
        'aria-label': ariaLabel ? `${ariaLabel}, ${colorPickerLabel}` : undefined
    }, isMobile ? colorPickerLabel : undefined);
    let ariaRoleDescription = stringFormatter.format('twoDimensionalSlider');
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $ea3928288112382f$export$a966af930f325cab)({
        style: {
            opacity: '0.0001',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        }
    });
    let { colorAreaStyleProps: colorAreaStyleProps, thumbStyleProps: thumbStyleProps } = (0, $ad8cc31e40d60e64$export$dd62420467d245ca)({
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


export {$12db0b624ec2ac09$export$2f92a7a615a014f6 as useColorArea};
//# sourceMappingURL=useColorArea.mjs.map
