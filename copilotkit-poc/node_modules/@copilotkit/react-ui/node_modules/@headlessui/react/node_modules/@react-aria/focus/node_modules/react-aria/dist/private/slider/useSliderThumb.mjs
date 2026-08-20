import {focusWithoutScrolling as $1969ac565cfec8d0$export$de79e2c695e052f3} from "../utils/focusWithoutScrolling.mjs";
import {getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getSliderThumbId as $b2a66ce670b3f60f$export$68e648cbec363a18, sliderData as $b2a66ce670b3f60f$export$d6c8d9636a3dc49c} from "./utils.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useFocusable as $d1116acdf220c2da$export$4c014de7c8940b4c} from "../interactions/useFocusable.mjs";
import {useFormReset as $3274bf1495747a7b$export$5add1d006293d136} from "../utils/useFormReset.mjs";
import {useGlobalListeners as $48a7d519b337145d$export$4eaf04e54aa8eed6} from "../utils/useGlobalListeners.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLabel as $0beb20c9744a2065$export$8467354a121f1b9f} from "../label/useLabel.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useMove as $1dfdc54e7eb53ba0$export$36da96379f79f245} from "../interactions/useMove.mjs";
import {clamp as $fiiar$clamp} from "react-stately/private/utils/number";
import {useCallback as $fiiar$useCallback, useEffect as $fiiar$useEffect, useRef as $fiiar$useRef} from "react";














function $4a5dd96ecb58ab11$export$8d15029008292ae(opts, state) {
    let { index: index = 0, isRequired: isRequired, validationState: validationState, isInvalid: isInvalid, trackRef: trackRef, inputRef: inputRef, orientation: orientation = state.orientation, name: name, form: form } = opts;
    let isDisabled = opts.isDisabled || state.isDisabled;
    let isVertical = orientation === 'vertical';
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $48a7d519b337145d$export$4eaf04e54aa8eed6)();
    let data = (0, $b2a66ce670b3f60f$export$d6c8d9636a3dc49c).get(state);
    const { labelProps: labelProps, fieldProps: fieldProps } = (0, $0beb20c9744a2065$export$8467354a121f1b9f)({
        ...opts,
        id: (0, $b2a66ce670b3f60f$export$68e648cbec363a18)(state, index),
        'aria-labelledby': `${data.id} ${opts['aria-labelledby'] ?? ''}`.trim()
    });
    const value = state.values[index];
    const focusInput = (0, $fiiar$useCallback)(()=>{
        if (inputRef.current) (0, $1969ac565cfec8d0$export$de79e2c695e052f3)(inputRef.current);
    }, [
        inputRef
    ]);
    const isFocused = state.focusedThumb === index;
    (0, $fiiar$useEffect)(()=>{
        if (isFocused) focusInput();
    }, [
        isFocused,
        focusInput
    ]);
    let reverseX = direction === 'rtl';
    let currentPosition = (0, $fiiar$useRef)(null);
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        onKeyDown (e) {
            let { getThumbMaxValue: getThumbMaxValue, getThumbMinValue: getThumbMinValue, decrementThumb: decrementThumb, incrementThumb: incrementThumb, setThumbValue: setThumbValue, setThumbDragging: setThumbDragging, pageSize: pageSize } = state;
            // these are the cases that useMove or useSlider don't handle
            if (!/^(PageUp|PageDown|Home|End)$/.test(e.key)) {
                e.continuePropagation();
                return;
            }
            // same handling as useMove, stopPropagation to prevent useSlider from handling the event as well.
            e.preventDefault();
            // remember to set this so that onChangeEnd is fired
            setThumbDragging(index, true);
            switch(e.key){
                case 'PageUp':
                    incrementThumb(index, pageSize);
                    break;
                case 'PageDown':
                    decrementThumb(index, pageSize);
                    break;
                case 'Home':
                    setThumbValue(index, getThumbMinValue(index));
                    break;
                case 'End':
                    setThumbValue(index, getThumbMaxValue(index));
                    break;
            }
            setThumbDragging(index, false);
        }
    });
    let { moveProps: moveProps } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)({
        onMoveStart () {
            currentPosition.current = null;
            state.setThumbDragging(index, true);
        },
        onMove ({ deltaX: deltaX, deltaY: deltaY, pointerType: pointerType, shiftKey: shiftKey }) {
            const { getThumbPercent: getThumbPercent, setThumbPercent: setThumbPercent, decrementThumb: decrementThumb, incrementThumb: incrementThumb, step: step, pageSize: pageSize } = state;
            if (!trackRef.current) return;
            let { width: width, height: height } = trackRef.current.getBoundingClientRect();
            let size = isVertical ? height : width;
            if (currentPosition.current == null) currentPosition.current = getThumbPercent(index) * size;
            if (pointerType === 'keyboard') {
                if (deltaX > 0 && reverseX || deltaX < 0 && !reverseX || deltaY > 0) decrementThumb(index, shiftKey ? pageSize : step);
                else incrementThumb(index, shiftKey ? pageSize : step);
            } else {
                let delta = isVertical ? deltaY : deltaX;
                if (isVertical || reverseX) delta = -delta;
                currentPosition.current += delta;
                setThumbPercent(index, (0, $fiiar$clamp)(currentPosition.current / size, 0, 1));
            }
        },
        onMoveEnd () {
            state.setThumbDragging(index, false);
        }
    });
    // Immediately register editability with the state
    state.setThumbEditable(index, !isDisabled);
    const { focusableProps: focusableProps } = (0, $d1116acdf220c2da$export$4c014de7c8940b4c)((0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(opts, {
        onFocus: ()=>state.setFocusedThumb(index),
        onBlur: ()=>state.setFocusedThumb(undefined)
    }), inputRef);
    let currentPointer = (0, $fiiar$useRef)(undefined);
    let onDown = (id)=>{
        focusInput();
        currentPointer.current = id;
        state.setThumbDragging(index, true);
        addGlobalListener(window, 'mouseup', onUp, false);
        addGlobalListener(window, 'touchend', onUp, false);
        addGlobalListener(window, 'pointerup', onUp, false);
    };
    let onUp = (e)=>{
        let id = e.pointerId ?? e.changedTouches?.[0].identifier;
        if (id === currentPointer.current) {
            focusInput();
            state.setThumbDragging(index, false);
            removeGlobalListener(window, 'mouseup', onUp, false);
            removeGlobalListener(window, 'touchend', onUp, false);
            removeGlobalListener(window, 'pointerup', onUp, false);
        }
    };
    let thumbPosition = state.getThumbPercent(index);
    if (isVertical || direction === 'rtl') thumbPosition = 1 - thumbPosition;
    let interactions = !isDisabled ? (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(keyboardProps, moveProps, {
        onMouseDown: (e)=>{
            if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
            onDown();
        },
        onPointerDown: (e)=>{
            if (e.button !== 0 || e.altKey || e.ctrlKey || e.metaKey) return;
            onDown(e.pointerId);
        },
        onTouchStart: (e)=>{
            onDown(e.changedTouches[0].identifier);
        }
    }) : {};
    (0, $3274bf1495747a7b$export$5add1d006293d136)(inputRef, state.defaultValues[index], (v)=>{
        state.setThumbValue(index, v);
    });
    // We install mouse handlers for the drag motion on the thumb div, but
    // not the key handler for moving the thumb with the slider.  Instead,
    // we focus the range input, and let the browser handle the keyboard
    // interactions; we then listen to input's onChange to update state.
    return {
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(focusableProps, fieldProps, {
            type: 'range',
            tabIndex: !isDisabled ? 0 : undefined,
            min: state.getThumbMinValue(index),
            max: state.getThumbMaxValue(index),
            step: state.step,
            value: value,
            name: name,
            form: form,
            disabled: isDisabled,
            'aria-orientation': orientation,
            'aria-valuetext': state.getThumbValueLabel(index),
            'aria-required': isRequired || undefined,
            'aria-invalid': isInvalid || validationState === 'invalid' || undefined,
            'aria-errormessage': opts['aria-errormessage'],
            'aria-describedby': [
                data['aria-describedby'],
                opts['aria-describedby']
            ].filter(Boolean).join(' '),
            'aria-details': [
                data['aria-details'],
                opts['aria-details']
            ].filter(Boolean).join(' '),
            onChange: (e)=>{
                state.setThumbValue(index, parseFloat((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e).value));
            }
        }),
        thumbProps: {
            ...interactions,
            style: {
                position: 'absolute',
                [isVertical ? 'top' : 'left']: `${thumbPosition * 100}%`,
                transform: 'translate(-50%, -50%)',
                touchAction: 'none'
            }
        },
        labelProps: labelProps,
        isDragging: state.isThumbDragging(index),
        isDisabled: isDisabled,
        isFocused: isFocused
    };
}


export {$4a5dd96ecb58ab11$export$8d15029008292ae as useSliderThumb};
//# sourceMappingURL=useSliderThumb.mjs.map
