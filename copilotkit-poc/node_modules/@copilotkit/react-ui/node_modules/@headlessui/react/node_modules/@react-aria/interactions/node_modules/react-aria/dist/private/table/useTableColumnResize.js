import {focusSafely as $56c81cdebdc6a696$export$80f3e147d781571c} from "../interactions/focusSafely.js";
import {getActiveElement as $d8ac7ed472840322$export$cd4e5573fbe2b576, getEventTarget as $d8ac7ed472840322$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.js";
import {getColumnHeaderId as $5519a0a73876c3da$export$37cd4213f2ad742e} from "./utils.js";
import $e1mcl$intlStringsjs from "./intlStrings.js";
import {mergeProps as $64c36edd757dfa16$export$9d1611c77c2fe928} from "../utils/mergeProps.js";
import {useDescription as $fe0741815591a8ca$export$f8aeda7b10753fa1} from "../utils/useDescription.js";
import {useEffectEvent as $85567ef950781b7d$export$7f54fc3180508a52} from "../utils/useEffectEvent.js";
import {useId as $0292efe68908de6b$export$f680877a34711e37} from "../utils/useId.js";
import {useInteractionModality as $b50b1cc8a843ace7$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.js";
import {useKeyboard as $bf74df7506f65576$export$8f71654801c2f7cd} from "../interactions/useKeyboard.js";
import {useLocale as $4defb058003b3e05$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.js";
import {useLocalizedStringFormatter as $1adfa757ef3cd864$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.js";
import {useMove as $e7c7f5ffbc8157af$export$36da96379f79f245} from "../interactions/useMove.js";
import {usePress as $a87f4c40785e693b$export$45712eceda6fad21} from "../interactions/usePress.js";
import {useVisuallyHidden as $6947385881e3ae0e$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.js";
import {useRef as $e1mcl$useRef, useCallback as $e1mcl$useCallback, useEffect as $e1mcl$useEffect} from "react";


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















function $966c74f4398bece2$export$52994e973806c219(props, state, ref) {
    let { column: item, triggerRef: triggerRef, isDisabled: isDisabled, onResizeStart: onResizeStart, onResize: onResize, onResizeEnd: onResizeEnd, 'aria-label': ariaLabel } = props;
    const stringFormatter = (0, $1adfa757ef3cd864$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($e1mcl$intlStringsjs))), '@react-aria/table');
    let id = (0, $0292efe68908de6b$export$f680877a34711e37)();
    let isResizing = state.resizingColumn === item.key;
    let isResizingRef = (0, $e1mcl$useRef)(isResizing);
    let lastSize = (0, $e1mcl$useRef)(null);
    let wasFocusedOnResizeStart = (0, $e1mcl$useRef)(false);
    let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;
    let { direction: direction } = (0, $4defb058003b3e05$export$43bb16f9c6d9e3f7)();
    let startResize = (0, $e1mcl$useCallback)((item)=>{
        if (!isResizingRef.current) {
            lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.startResize(item.key);
            state.tableState.setKeyboardNavigationDisabled(true);
            onResizeStart === null || onResizeStart === void 0 ? void 0 : onResizeStart(lastSize.current);
        }
        isResizingRef.current = true;
    }, [
        state,
        onResizeStart
    ]);
    let resize = (0, $e1mcl$useCallback)((item, newWidth)=>{
        let sizes = state.updateResizedColumns(item.key, newWidth);
        onResize === null || onResize === void 0 ? void 0 : onResize(sizes);
        lastSize.current = sizes;
    }, [
        state,
        onResize
    ]);
    let endResize = (0, $e1mcl$useCallback)((item)=>{
        if (isResizingRef.current) {
            if (lastSize.current == null) lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.endResize();
            state.tableState.setKeyboardNavigationDisabled(false);
            onResizeEnd === null || onResizeEnd === void 0 ? void 0 : onResizeEnd(lastSize.current);
            isResizingRef.current = false;
            if ((triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current) && !wasFocusedOnResizeStart.current) // switch focus back to the column header unless the resizer was already focused when resizing started.
            (0, $56c81cdebdc6a696$export$80f3e147d781571c)(triggerRef.current);
        }
        lastSize.current = null;
    }, [
        state,
        triggerRef,
        onResizeEnd
    ]);
    let { keyboardProps: keyboardProps } = (0, $bf74df7506f65576$export$8f71654801c2f7cd)({
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
    const columnResizeWidthRef = (0, $e1mcl$useRef)(0);
    const { moveProps: moveProps } = (0, $e7c7f5ffbc8157af$export$36da96379f79f245)({
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
    let onKeyDown = (0, $e1mcl$useCallback)((e)=>{
        var _moveProps_onKeyDown;
        if (editModeEnabled) (_moveProps_onKeyDown = moveProps.onKeyDown) === null || _moveProps_onKeyDown === void 0 ? void 0 : _moveProps_onKeyDown.call(moveProps, e);
    }, [
        editModeEnabled,
        moveProps
    ]);
    let min = Math.floor(state.getColumnMinWidth(item.key));
    let max = Math.floor(state.getColumnMaxWidth(item.key));
    if (max === Infinity) max = Number.MAX_SAFE_INTEGER;
    let value = Math.floor(state.getColumnWidth(item.key));
    let modality = (0, $b50b1cc8a843ace7$export$98e20ec92f614cfe)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'touch';
    let description = (triggerRef === null || triggerRef === void 0 ? void 0 : triggerRef.current) == null && (modality === 'keyboard' || modality === 'virtual') && !isResizing ? stringFormatter.format('resizerDescription') : undefined;
    let descriptionProps = (0, $fe0741815591a8ca$export$f8aeda7b10753fa1)(description);
    let ariaProps = {
        'aria-label': ariaLabel,
        'aria-orientation': 'horizontal',
        'aria-labelledby': `${id} ${(0, $5519a0a73876c3da$export$37cd4213f2ad742e)(state.tableState, item.key)}`,
        'aria-valuetext': stringFormatter.format('columnSize', {
            value: value
        }),
        type: 'range',
        min: min,
        max: max,
        value: value,
        ...descriptionProps
    };
    const focusInput = (0, $e1mcl$useCallback)(()=>{
        if (ref.current) (0, $56c81cdebdc6a696$export$80f3e147d781571c)(ref.current);
    }, [
        ref
    ]);
    let resizingColumn = state.resizingColumn;
    let prevResizingColumn = (0, $e1mcl$useRef)(null);
    let startResizeEvent = (0, $85567ef950781b7d$export$7f54fc3180508a52)(startResize);
    (0, $e1mcl$useEffect)(()=>{
        if (prevResizingColumn.current !== resizingColumn && resizingColumn != null && resizingColumn === item.key) {
            wasFocusedOnResizeStart.current = (0, $d8ac7ed472840322$export$cd4e5573fbe2b576)() === ref.current;
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
        let nextValue = parseFloat((0, $d8ac7ed472840322$export$e58f029f0fbfdb29)(e).value);
        if (nextValue > currentWidth) nextValue = currentWidth + 10;
        else nextValue = currentWidth - 10;
        resize(item, nextValue);
    };
    let { pressProps: pressProps } = (0, $a87f4c40785e693b$export$45712eceda6fad21)({
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
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $6947385881e3ae0e$export$a966af930f325cab)();
    return {
        resizerProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(keyboardProps, {
            ...moveProps,
            onKeyDown: onKeyDown
        }, pressProps, {
            style: {
                touchAction: 'none'
            }
        }),
        inputProps: (0, $64c36edd757dfa16$export$9d1611c77c2fe928)(visuallyHiddenProps, {
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


export {$966c74f4398bece2$export$52994e973806c219 as useTableColumnResize};
//# sourceMappingURL=useTableColumnResize.js.map
