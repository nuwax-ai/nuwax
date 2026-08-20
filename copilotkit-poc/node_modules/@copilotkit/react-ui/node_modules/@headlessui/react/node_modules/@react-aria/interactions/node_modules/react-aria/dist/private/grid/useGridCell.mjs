import {focusSafely as $f192c2f16961cbe0$export$80f3e147d781571c} from "../interactions/focusSafely.mjs";
import {getActiveElement as $23f2114a1b82827e$export$cd4e5573fbe2b576, getEventTarget as $23f2114a1b82827e$export$e58f029f0fbfdb29, isFocusWithin as $23f2114a1b82827e$export$b4f377a2b6254582, nodeContains as $23f2114a1b82827e$export$4282f70798064fe0} from "../utils/shadowdom/DOMFunctions.mjs";
import {getFocusableTreeWalker as $535772f9d2c1f38d$export$2d6ec8fc375ceafa} from "../focus/FocusScope.mjs";
import {getScrollParent as $3578607fe3d4b096$export$cfa2225e87938781} from "../utils/getScrollParent.mjs";
import {gridMap as $90a81c508a5c0de1$export$e6235c0d09b995d0} from "./utils.mjs";
import {isFocusVisible as $8f5a2122b0992be3$export$b9b3dfddab17db27} from "../interactions/useFocusVisible.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {scrollIntoViewport as $51a3e22a5186a962$export$c826860796309d1b} from "../utils/scrollIntoView.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {useSelectableItem as $f6ba6936bfd098a0$export$ecf600387e221c37} from "../selection/useSelectableItem.mjs";
import {useRef as $jAbxn$useRef} from "react";

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










function $a4d729ad50b8576a$export$c7e10bfc0c59f67c(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized, focusMode: focusMode = 'child', shouldSelectOnPressUp: shouldSelectOnPressUp, onAction: onAction } = props;
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let { keyboardDelegate: keyboardDelegate, actions: { onCellAction: onCellAction } } = (0, $90a81c508a5c0de1$export$e6235c0d09b995d0).get(state);
    // We need to track the key of the item at the time it was last focused so that we force
    // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
    let keyWhenFocused = (0, $jAbxn$useRef)(null);
    // Handles focusing the cell. If there is a focusable child,
    // it is focused, otherwise the cell itself is focused.
    let focus = ()=>{
        if (ref.current) {
            let treeWalker = (0, $535772f9d2c1f38d$export$2d6ec8fc375ceafa)(ref.current);
            if (focusMode === 'child') {
                // If focus is already on a focusable child within the cell, early return so we don't shift focus
                if ((0, $23f2114a1b82827e$export$b4f377a2b6254582)(ref.current) && ref.current !== (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)()) return;
                let focusable = state.selectionManager.childFocusStrategy === 'last' ? $a4d729ad50b8576a$var$last(treeWalker) : treeWalker.firstChild();
                if (focusable) {
                    (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                    return;
                }
            }
            if (keyWhenFocused.current != null && node.key !== keyWhenFocused.current || !(0, $23f2114a1b82827e$export$b4f377a2b6254582)(ref.current)) (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
        }
    };
    let { itemProps: itemProps, isPressed: isPressed } = (0, $f6ba6936bfd098a0$export$ecf600387e221c37)({
        selectionManager: state.selectionManager,
        key: node.key,
        ref: ref,
        isVirtualized: isVirtualized,
        focus: focus,
        shouldSelectOnPressUp: shouldSelectOnPressUp,
        onAction: onCellAction ? ()=>onCellAction(node.key) : onAction,
        isDisabled: state.collection.size === 0
    });
    let onKeyDownCapture = (e)=>{
        let activeElement = (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)();
        if (!(0, $23f2114a1b82827e$export$4282f70798064fe0)(e.currentTarget, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e)) || state.isKeyboardNavigationDisabled || !ref.current || !activeElement) return;
        let walker = (0, $535772f9d2c1f38d$export$2d6ec8fc375ceafa)(ref.current);
        walker.currentNode = activeElement;
        switch(e.key){
            case 'ArrowLeft':
                {
                    // Find the next focusable element within the cell.
                    let focusable = direction === 'rtl' ? walker.nextNode() : walker.previousNode();
                    // Don't focus the cell itself if focusMode is "child"
                    if (focusMode === 'child' && focusable === ref.current) focusable = null;
                    e.preventDefault();
                    e.stopPropagation();
                    if (focusable) {
                        (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                        (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        // If there is no next focusable child, then move to the next cell to the left of this one.
                        // This will be handled by useSelectableCollection. However, if there is no cell to the left
                        // of this one, only one column, and the grid doesn't focus rows, then the next key will be the
                        // same as this one. In that case we need to handle focusing either the cell or the first/last
                        // child, depending on the focus mode.
                        let prev = keyboardDelegate.getKeyLeftOf?.(node.key);
                        if (prev !== node.key) {
                            // We prevent the capturing event from reaching children of the cell, e.g. pickers.
                            // We want arrow keys to navigate to the next cell instead. We need to re-dispatch
                            // the event from a higher parent so it still bubbles and gets handled by useSelectableCollection.
                            ref.current.parentElement?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                            break;
                        }
                        if (focusMode === 'cell' && direction === 'rtl') {
                            (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
                            (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable = direction === 'rtl' ? walker.firstChild() : $a4d729ad50b8576a$var$last(walker);
                            if (focusable) {
                                (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                                (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                                    containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case 'ArrowRight':
                {
                    let focusable = direction === 'rtl' ? walker.previousNode() : walker.nextNode();
                    if (focusMode === 'child' && focusable === ref.current) focusable = null;
                    e.preventDefault();
                    e.stopPropagation();
                    if (focusable) {
                        (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                        (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                            containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                        });
                    } else {
                        let next = keyboardDelegate.getKeyRightOf?.(node.key);
                        if (next !== node.key) {
                            // We prevent the capturing event from reaching children of the cell, e.g. pickers.
                            // We want arrow keys to navigate to the next cell instead. We need to re-dispatch
                            // the event from a higher parent so it still bubbles and gets handled by useSelectableCollection.
                            ref.current.parentElement?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                            break;
                        }
                        if (focusMode === 'cell' && direction === 'ltr') {
                            (0, $f192c2f16961cbe0$export$80f3e147d781571c)(ref.current);
                            (0, $51a3e22a5186a962$export$c826860796309d1b)(ref.current, {
                                containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable = direction === 'rtl' ? $a4d729ad50b8576a$var$last(walker) : walker.firstChild();
                            if (focusable) {
                                (0, $f192c2f16961cbe0$export$80f3e147d781571c)(focusable);
                                (0, $51a3e22a5186a962$export$c826860796309d1b)(focusable, {
                                    containingElement: (0, $3578607fe3d4b096$export$cfa2225e87938781)(ref.current)
                                });
                            }
                        }
                    }
                    break;
                }
            case 'ArrowUp':
            case 'ArrowDown':
                // Prevent this event from reaching cell children, e.g. menu buttons. We want arrow keys to navigate
                // to the cell above/below instead. We need to re-dispatch the event from a higher parent so it still
                // bubbles and gets handled by useSelectableCollection.
                if (!e.altKey && (0, $23f2114a1b82827e$export$4282f70798064fe0)(ref.current, (0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e))) {
                    e.stopPropagation();
                    e.preventDefault();
                    ref.current.parentElement?.dispatchEvent(new KeyboardEvent(e.nativeEvent.type, e.nativeEvent));
                }
                break;
        }
    };
    // Grid cells can have focusable elements inside them. In this case, focus should
    // be marshalled to that element rather than focusing the cell itself.
    let onFocus = (e)=>{
        keyWhenFocused.current = node.key;
        if ((0, $23f2114a1b82827e$export$e58f029f0fbfdb29)(e) !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the gridcell itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row/cell
            // in that case since the table should act like a single tab stop.
            if (!(0, $8f5a2122b0992be3$export$b9b3dfddab17db27)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
        // If the cell itself is focused, wait a frame so that focus finishes propagatating
        // up to the tree, and move focus to a focusable child if possible.
        requestAnimationFrame(()=>{
            if (focusMode === 'child' && (0, $23f2114a1b82827e$export$cd4e5573fbe2b576)() === ref.current) focus();
        });
    };
    let gridCellProps = (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(itemProps, {
        role: 'gridcell',
        onKeyDownCapture: onKeyDownCapture,
        'aria-colspan': node.colSpan,
        'aria-colindex': node.colIndex != null ? node.colIndex + 1 : undefined,
        colSpan: isVirtualized ? undefined : node.colSpan,
        onFocus: onFocus
    });
    if (isVirtualized) gridCellProps['aria-colindex'] = (node.colIndex ?? node.index) + 1; // aria-colindex is 1-based
    // When pressing with a pointer and cell selection is not enabled, usePress will be applied to the
    // row rather than the cell. However, when the row is draggable, usePress cannot preventDefault
    // on pointer down, so the browser will try to focus the cell which has a tabIndex applied.
    // To avoid this, remove the tabIndex from the cell briefly on pointer down.
    if (shouldSelectOnPressUp && gridCellProps.tabIndex != null && gridCellProps.onPointerDown == null) gridCellProps.onPointerDown = (e)=>{
        let el = e.currentTarget;
        let tabindex = el.getAttribute('tabindex');
        el.removeAttribute('tabindex');
        requestAnimationFrame(()=>{
            if (tabindex != null) el.setAttribute('tabindex', tabindex);
        });
    };
    return {
        gridCellProps: gridCellProps,
        isPressed: isPressed
    };
}
function $a4d729ad50b8576a$var$last(walker) {
    let next = null;
    let last = null;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}


export {$a4d729ad50b8576a$export$c7e10bfc0c59f67c as useGridCell};
//# sourceMappingURL=useGridCell.mjs.map
