var $4b9e9ed3f006ad27$exports = require("../utils/focusWithoutScrolling.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $360420b928cc5d13$exports = require("./utils.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $cfe896014413cb8c$exports = require("../interactions/useFocusable.cjs");
var $bbab3903416f8d01$exports = require("../utils/useFormReset.cjs");
var $04affd2086a7db64$exports = require("../utils/useGlobalListeners.cjs");
var $6d2f10bb8b359da5$exports = require("../interactions/useKeyboard.cjs");
var $ec895d26f03379ea$exports = require("../label/useLabel.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $2304f84c457be372$exports = require("../interactions/useMove.cjs");
var $hI0kH$reactstatelyprivateutilsnumber = require("react-stately/private/utils/number");
var $hI0kH$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useSliderThumb", function () { return $8dc698834b01506b$export$8d15029008292ae; });













function $8dc698834b01506b$export$8d15029008292ae(opts, state) {
    let { index: index = 0, isRequired: isRequired, validationState: validationState, isInvalid: isInvalid, trackRef: trackRef, inputRef: inputRef, orientation: orientation = state.orientation, name: name, form: form } = opts;
    let isDisabled = opts.isDisabled || state.isDisabled;
    let isVertical = orientation === 'vertical';
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let { addGlobalListener: addGlobalListener, removeGlobalListener: removeGlobalListener } = (0, $04affd2086a7db64$exports.useGlobalListeners)();
    let data = (0, $360420b928cc5d13$exports.sliderData).get(state);
    const { labelProps: labelProps, fieldProps: fieldProps } = (0, $ec895d26f03379ea$exports.useLabel)({
        ...opts,
        id: (0, $360420b928cc5d13$exports.getSliderThumbId)(state, index),
        'aria-labelledby': `${data.id} ${opts['aria-labelledby'] ?? ''}`.trim()
    });
    const value = state.values[index];
    const focusInput = (0, $hI0kH$react.useCallback)(()=>{
        if (inputRef.current) (0, $4b9e9ed3f006ad27$exports.focusWithoutScrolling)(inputRef.current);
    }, [
        inputRef
    ]);
    const isFocused = state.focusedThumb === index;
    (0, $hI0kH$react.useEffect)(()=>{
        if (isFocused) focusInput();
    }, [
        isFocused,
        focusInput
    ]);
    let reverseX = direction === 'rtl';
    let currentPosition = (0, $hI0kH$react.useRef)(null);
    let { keyboardProps: keyboardProps } = (0, $6d2f10bb8b359da5$exports.useKeyboard)({
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
    let { moveProps: moveProps } = (0, $2304f84c457be372$exports.useMove)({
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
                setThumbPercent(index, (0, $hI0kH$reactstatelyprivateutilsnumber.clamp)(currentPosition.current / size, 0, 1));
            }
        },
        onMoveEnd () {
            state.setThumbDragging(index, false);
        }
    });
    // Immediately register editability with the state
    state.setThumbEditable(index, !isDisabled);
    const { focusableProps: focusableProps } = (0, $cfe896014413cb8c$exports.useFocusable)((0, $89b39774f3b79dbb$exports.mergeProps)(opts, {
        onFocus: ()=>state.setFocusedThumb(index),
        onBlur: ()=>state.setFocusedThumb(undefined)
    }), inputRef);
    let currentPointer = (0, $hI0kH$react.useRef)(undefined);
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
    let interactions = !isDisabled ? (0, $89b39774f3b79dbb$exports.mergeProps)(keyboardProps, moveProps, {
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
    (0, $bbab3903416f8d01$exports.useFormReset)(inputRef, state.defaultValues[index], (v)=>{
        state.setThumbValue(index, v);
    });
    // We install mouse handlers for the drag motion on the thumb div, but
    // not the key handler for moving the thumb with the slider.  Instead,
    // we focus the range input, and let the browser handle the keyboard
    // interactions; we then listen to input's onChange to update state.
    return {
        inputProps: (0, $89b39774f3b79dbb$exports.mergeProps)(focusableProps, fieldProps, {
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
                state.setThumbValue(index, parseFloat((0, $da02ee888921bc9e$exports.getEventTarget)(e).value));
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


//# sourceMappingURL=useSliderThumb.cjs.map
