var $4a053a4bf25e52fb$exports = require("../interactions/focusSafely.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $589a6443185dab0f$exports = require("./utils.cjs");
var $526eef38cac7f2b8$exports = require("./intlStrings.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $2205bbfafbd0b5cd$exports = require("../utils/useDescription.cjs");
var $d6e22460ce4d6b26$exports = require("../utils/useEffectEvent.cjs");
var $7ac82d1fee77eb8a$exports = require("../utils/useId.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $6d2f10bb8b359da5$exports = require("../interactions/useKeyboard.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $d4e8e26182baab6e$exports = require("../i18n/useLocalizedStringFormatter.cjs");
var $2304f84c457be372$exports = require("../interactions/useMove.cjs");
var $1d003dcb6308cd89$exports = require("../interactions/usePress.cjs");
var $3455634180ecf75c$exports = require("../visually-hidden/VisuallyHidden.cjs");
var $jPYmD$react = require("react");


function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useTableColumnResize", function () { return $0c8ce4d883832c66$export$52994e973806c219; });
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















function $0c8ce4d883832c66$export$52994e973806c219(props, state, ref) {
    let { column: item, triggerRef: triggerRef, isDisabled: isDisabled, onResizeStart: onResizeStart, onResize: onResize, onResizeEnd: onResizeEnd, 'aria-label': ariaLabel } = props;
    const stringFormatter = (0, $d4e8e26182baab6e$exports.useLocalizedStringFormatter)((0, ($parcel$interopDefault($526eef38cac7f2b8$exports))), '@react-aria/table');
    let id = (0, $7ac82d1fee77eb8a$exports.useId)();
    let isResizing = state.resizingColumn === item.key;
    let isResizingRef = (0, $jPYmD$react.useRef)(isResizing);
    let lastSize = (0, $jPYmD$react.useRef)(null);
    let wasFocusedOnResizeStart = (0, $jPYmD$react.useRef)(false);
    let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let startResize = (0, $jPYmD$react.useCallback)((item)=>{
        if (!isResizingRef.current) {
            lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.startResize(item.key);
            state.tableState.setKeyboardNavigationDisabled(true);
            onResizeStart?.(lastSize.current);
        }
        isResizingRef.current = true;
    }, [
        state,
        onResizeStart
    ]);
    let resize = (0, $jPYmD$react.useCallback)((item, newWidth)=>{
        let sizes = state.updateResizedColumns(item.key, newWidth);
        onResize?.(sizes);
        lastSize.current = sizes;
    }, [
        state,
        onResize
    ]);
    let endResize = (0, $jPYmD$react.useCallback)((item)=>{
        if (isResizingRef.current) {
            if (lastSize.current == null) lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.endResize();
            state.tableState.setKeyboardNavigationDisabled(false);
            onResizeEnd?.(lastSize.current);
            isResizingRef.current = false;
            if (triggerRef?.current && !wasFocusedOnResizeStart.current) // switch focus back to the column header unless the resizer was already focused when resizing started.
            (0, $4a053a4bf25e52fb$exports.focusSafely)(triggerRef.current);
        }
        lastSize.current = null;
    }, [
        state,
        triggerRef,
        onResizeEnd
    ]);
    let { keyboardProps: keyboardProps } = (0, $6d2f10bb8b359da5$exports.useKeyboard)({
        onKeyDown: (e)=>{
            if (editModeEnabled) {
                if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Tab') {
                    e.preventDefault();
                    endResize(item);
                }
            } else {
                // Continue propagation on keydown events so they still bubbles to useSelectableCollection and are handled there
                e.continuePropagation();
                if (e.key === 'Enter') startResize(item);
            }
        }
    });
    const columnResizeWidthRef = (0, $jPYmD$react.useRef)(0);
    const { moveProps: moveProps } = (0, $2304f84c457be372$exports.useMove)({
        onMoveStart () {
            columnResizeWidthRef.current = state.getColumnWidth(item.key);
            startResize(item);
        },
        onMove (e) {
            let { deltaX: deltaX, deltaY: deltaY, pointerType: pointerType } = e;
            if (direction === 'rtl') deltaX *= -1;
            if (pointerType === 'keyboard') {
                if (deltaY !== 0 && deltaX === 0) deltaX = deltaY * -1;
                deltaX *= 10;
            }
            // if moving up/down only, no need to resize
            if (deltaX !== 0) {
                columnResizeWidthRef.current += deltaX;
                resize(item, columnResizeWidthRef.current);
            }
        },
        onMoveEnd (e) {
            let { pointerType: pointerType } = e;
            columnResizeWidthRef.current = 0;
            if (pointerType === 'mouse' || pointerType === 'touch' && wasFocusedOnResizeStart.current) endResize(item);
        }
    });
    let onKeyDown = (0, $jPYmD$react.useCallback)((e)=>{
        if (editModeEnabled) moveProps.onKeyDown?.(e);
    }, [
        editModeEnabled,
        moveProps
    ]);
    let min = Math.floor(state.getColumnMinWidth(item.key));
    let max = Math.floor(state.getColumnMaxWidth(item.key));
    if (max === Infinity) max = Number.MAX_SAFE_INTEGER;
    let value = Math.floor(state.getColumnWidth(item.key));
    let modality = (0, $d0df89f3abe2c2ca$exports.useInteractionModality)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'touch';
    let description = triggerRef?.current == null && (modality === 'keyboard' || modality === 'virtual') && !isResizing ? stringFormatter.format('resizerDescription') : undefined;
    let descriptionProps = (0, $2205bbfafbd0b5cd$exports.useDescription)(description);
    let ariaProps = {
        'aria-label': ariaLabel,
        'aria-orientation': 'horizontal',
        'aria-labelledby': `${id} ${(0, $589a6443185dab0f$exports.getColumnHeaderId)(state.tableState, item.key)}`,
        'aria-valuetext': stringFormatter.format('columnSize', {
            value: value
        }),
        type: 'range',
        min: min,
        max: max,
        value: value,
        ...descriptionProps
    };
    const focusInput = (0, $jPYmD$react.useCallback)(()=>{
        if (ref.current) (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
    }, [
        ref
    ]);
    let resizingColumn = state.resizingColumn;
    let prevResizingColumn = (0, $jPYmD$react.useRef)(null);
    let startResizeEvent = (0, $d6e22460ce4d6b26$exports.useEffectEvent)(startResize);
    (0, $jPYmD$react.useEffect)(()=>{
        if (prevResizingColumn.current !== resizingColumn && resizingColumn != null && resizingColumn === item.key) {
            wasFocusedOnResizeStart.current = (0, $da02ee888921bc9e$exports.getActiveElement)() === ref.current;
            startResizeEvent(item);
            // Delay focusing input until Android Chrome's delayed click after touchend happens: https://bugs.chromium.org/p/chromium/issues/detail?id=1150073
            let timeout = setTimeout(()=>focusInput(), 0);
            // VoiceOver on iOS has problems focusing the input from a menu.
            let VOTimeout = setTimeout(focusInput, 400);
            return ()=>{
                clearTimeout(timeout);
                clearTimeout(VOTimeout);
            };
        }
        prevResizingColumn.current = resizingColumn;
    }, [
        resizingColumn,
        item,
        focusInput,
        ref
    ]);
    let onChange = (e)=>{
        let currentWidth = state.getColumnWidth(item.key);
        let nextValue = parseFloat((0, $da02ee888921bc9e$exports.getEventTarget)(e).value);
        if (nextValue > currentWidth) nextValue = currentWidth + 10;
        else nextValue = currentWidth - 10;
        resize(item, nextValue);
    };
    let { pressProps: pressProps } = (0, $1d003dcb6308cd89$exports.usePress)({
        preventFocusOnPress: true,
        onPressStart: (e)=>{
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || e.pointerType === 'keyboard') return;
            if (e.pointerType === 'virtual' && state.resizingColumn != null) {
                endResize(item);
                return;
            }
            // Sometimes onPress won't trigger for quick taps on mobile so we want to focus the input so blurring away
            // can cancel resize mode for us.
            focusInput();
            // If resizer is always visible, mobile screenreader user can access the visually hidden resizer directly and thus we don't need
            // to handle a virtual click to start the resizer.
            if (e.pointerType !== 'virtual') startResize(item);
        },
        onPress: (e)=>{
            if ((e.pointerType === 'touch' && wasFocusedOnResizeStart.current || e.pointerType === 'mouse') && state.resizingColumn != null) endResize(item);
        }
    });
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $3455634180ecf75c$exports.useVisuallyHidden)();
    return {
        resizerProps: (0, $89b39774f3b79dbb$exports.mergeProps)(keyboardProps, {
            ...moveProps,
            onKeyDown: onKeyDown
        }, pressProps, {
            style: {
                touchAction: 'none'
            }
        }),
        inputProps: (0, $89b39774f3b79dbb$exports.mergeProps)(visuallyHiddenProps, {
            id: id,
            onBlur: ()=>{
                endResize(item);
            },
            onChange: onChange,
            disabled: isDisabled
        }, ariaProps),
        isResizing: isResizing
    };
}


//# sourceMappingURL=useTableColumnResize.cjs.map
