import {focusSafely as $f192c2f16961cbe0$export$80f3e147d781571c} from "../interactions/focusSafely.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29} from "../utils/shadowdom/DOMFunctions.mjs";
import {getColumnHeaderId as $cf56c58f505db99a$export$37cd4213f2ad742e} from "./utils.mjs";
import $jgovN$intlStringsmjs from "./intlStrings.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDescription as $121970af65029459$export$f8aeda7b10753fa1} from "../utils/useDescription.mjs";
import {useEffectEvent as $fe16bffc7a557bf0$export$7f54fc3180508a52} from "../utils/useEffectEvent.mjs";
import {useId as $390e54f620492c70$export$f680877a34711e37} from "../utils/useId.mjs";
import {useInteractionModality as $8f5a2122b0992be3$export$98e20ec92f614cfe} from "../interactions/useFocusVisible.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useLocalizedStringFormatter as $cf2482eff2eeeec2$export$f12b703ca79dfbb1} from "../i18n/useLocalizedStringFormatter.mjs";
import {useMove as $1dfdc54e7eb53ba0$export$36da96379f79f245} from "../interactions/useMove.mjs";
import {usePress as $d27d541f9569d26d$export$45712eceda6fad21} from "../interactions/usePress.mjs";
import {useVisuallyHidden as $ea3928288112382f$export$a966af930f325cab} from "../visually-hidden/VisuallyHidden.mjs";
import {useRef as $jgovN$useRef, useCallback as $jgovN$useCallback, useEffect as $jgovN$useEffect} from "react";


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















function $963a203da37f9c8f$export$52994e973806c219(props, state, ref) {
    let { column: item, triggerRef: triggerRef, isDisabled: isDisabled, onResizeStart: onResizeStart, onResize: onResize, onResizeEnd: onResizeEnd, 'aria-label': ariaLabel } = props;
    const stringFormatter = (0, $cf2482eff2eeeec2$export$f12b703ca79dfbb1)((0, ($parcel$interopDefault($jgovN$intlStringsmjs))), '@react-aria/table');
    let id = (0, $390e54f620492c70$export$f680877a34711e37)();
    let isResizing = state.resizingColumn === item.key;
    let isResizingRef = (0, $jgovN$useRef)(isResizing);
    let lastSize = (0, $jgovN$useRef)(null);
    let wasFocusedOnResizeStart = (0, $jgovN$useRef)(false);
    let editModeEnabled = state.tableState.isKeyboardNavigationDisabled;
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let startResize = (0, $jgovN$useCallback)((item)=>{
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
    let resize = (0, $jgovN$useCallback)((item, newWidth)=>{
        let sizes = state.updateResizedColumns(item.key, newWidth);
        onResize?.(sizes);
        lastSize.current = sizes;
    }, [
        state,
        onResize
    ]);
    let endResize = (0, $jgovN$useCallback)((item)=>{
        if (isResizingRef.current) {
            if (lastSize.current == null) lastSize.current = state.updateResizedColumns(item.key, state.getColumnWidth(item.key));
            state.endResize();
            state.tableState.setKeyboardNavigationDisabled(false);
            onResizeEnd?.(lastSize.current);
            isResizingRef.current = false;
            if (triggerRef?.current && !wasFocusedOnResizeStart.current) // switch focus back to the column header unless the resizer was already focused when resizing started.
            (0, $f192c2f16961cbe0$export$80f3e147d781571c)(triggerRef.current);
        }
        lastSize.current = null;
    }, [
        state,
        triggerRef,
        onResizeEnd
    ]);
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
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
    const columnResizeWidthRef = (0, $jgovN$useRef)(0);
    const { moveProps: moveProps } = (0, $1dfdc54e7eb53ba0$export$36da96379f79f245)({
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
    let onKeyDown = (0, $jgovN$useCallback)((e)=>{
        if (editModeEnabled) moveProps.onKeyDown?.(e);
    }, [
        editModeEnabled,
        moveProps
    ]);
    let min = Math.floor(state.getColumnMinWidth(item.key));
    let max = Math.floor(state.getColumnMaxWidth(item.key));
    if (max === Infinity) max = Number.MAX_SAFE_INTEGER;
    let value = Math.floor(state.getColumnWidth(item.key));
    let modality = (0, $8f5a2122b0992be3$export$98e20ec92f614cfe)();
    if (modality === 'virtual' && typeof window !== 'undefined' && 'ontouchstart' in window) modality = 'touch';
    let description = triggerRef?.current == null && (modality === 'keyboard' || modality === 'virtual') && !isResizing ? stringFormatter.format('resizerDescription') : undefined;
    let descriptionProps = (0, $121970af65029459$export$f8aeda7b10753fa1)(description);
    let ariaProps = {
        'aria-label': ariaLabel,
        'aria-orientation': 'horizontal',
        'aria-labelledby': `${id} ${(0, $cf56c58f505db99a$export$37cd4213f2ad742e)(state.tableState, item.key)}`,
        'aria-valuetext': stringFormatter.format('columnSize', {
            value: value
        }),
        type: 'range',
        min: min,
        max: max,
        value: value,
        ...descriptionProps
    };
    const focusInput = (0, $jgovN$useCallback)(()=>{
        if (ref.current) (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
    }, [
        ref
    ]);
    let resizingColumn = state.resizingColumn;
    let prevResizingColumn = (0, $jgovN$useRef)(null);
    let startResizeEvent = (0, $fe16bffc7a557bf0$export$7f54fc3180508a52)(startResize);
    (0, $jgovN$useEffect)(()=>{
        if (prevResizingColumn.current !== resizingColumn && resizingColumn != null && resizingColumn === item.key) {
            wasFocusedOnResizeStart.current = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() === ref.current;
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
        let nextValue = parseFloat((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e).value);
        if (nextValue > currentWidth) nextValue = currentWidth + 10;
        else nextValue = currentWidth - 10;
        resize(item, nextValue);
    };
    let { pressProps: pressProps } = (0, $d27d541f9569d26d$export$45712eceda6fad21)({
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
    let { visuallyHiddenProps: visuallyHiddenProps } = (0, $ea3928288112382f$export$a966af930f325cab)();
    return {
        resizerProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(keyboardProps, {
            ...moveProps,
            onKeyDown: onKeyDown
        }, pressProps, {
            style: {
                touchAction: 'none'
            }
        }),
        inputProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(visuallyHiddenProps, {
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


export {$963a203da37f9c8f$export$52994e973806c219 as useTableColumnResize};
//# sourceMappingURL=useTableColumnResize.mjs.map
