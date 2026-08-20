var $4a053a4bf25e52fb$exports = require("../interactions/focusSafely.cjs");
var $da02ee888921bc9e$exports = require("../utils/shadowdom/DOMFunctions.cjs");
var $9fb4ac1cc58342cc$exports = require("../focus/FocusScope.cjs");
var $d865e4ff74ef4a73$exports = require("../utils/getScrollParent.cjs");
var $d558273e57410528$exports = require("./utils.cjs");
var $d0df89f3abe2c2ca$exports = require("../interactions/useFocusVisible.cjs");
var $89b39774f3b79dbb$exports = require("../utils/mergeProps.cjs");
var $9a1324d6ffd8bbb0$exports = require("../utils/scrollIntoView.cjs");
var $2522e612fa919664$exports = require("../i18n/I18nProvider.cjs");
var $f38c7e3583533f40$exports = require("../selection/useSelectableItem.cjs");
var $erC6p$react = require("react");


function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useGridCell", function () { return $83fb058f79cd147c$export$c7e10bfc0c59f67c; });
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










function $83fb058f79cd147c$export$c7e10bfc0c59f67c(props, state, ref) {
    let { node: node, isVirtualized: isVirtualized, focusMode: focusMode = 'child', shouldSelectOnPressUp: shouldSelectOnPressUp, onAction: onAction } = props;
    let { direction: direction } = (0, $2522e612fa919664$exports.useLocale)();
    let { keyboardDelegate: keyboardDelegate, actions: { onCellAction: onCellAction } } = (0, $d558273e57410528$exports.gridMap).get(state);
    // We need to track the key of the item at the time it was last focused so that we force
    // focus to go to the item when the DOM node is reused for a different item in a virtualizer.
    let keyWhenFocused = (0, $erC6p$react.useRef)(null);
    // Handles focusing the cell. If there is a focusable child,
    // it is focused, otherwise the cell itself is focused.
    let focus = ()=>{
        if (ref.current) {
            let treeWalker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(ref.current);
            if (focusMode === 'child') {
                // If focus is already on a focusable child within the cell, early return so we don't shift focus
                if ((0, $da02ee888921bc9e$exports.isFocusWithin)(ref.current) && ref.current !== (0, $da02ee888921bc9e$exports.getActiveElement)()) return;
                let focusable = state.selectionManager.childFocusStrategy === 'last' ? $83fb058f79cd147c$var$last(treeWalker) : treeWalker.firstChild();
                if (focusable) {
                    (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                    return;
                }
            }
            if (keyWhenFocused.current != null && node.key !== keyWhenFocused.current || !(0, $da02ee888921bc9e$exports.isFocusWithin)(ref.current)) (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
        }
    };
    let { itemProps: itemProps, isPressed: isPressed } = (0, $f38c7e3583533f40$exports.useSelectableItem)({
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
        let activeElement = (0, $da02ee888921bc9e$exports.getActiveElement)();
        if (!(0, $da02ee888921bc9e$exports.nodeContains)(e.currentTarget, (0, $da02ee888921bc9e$exports.getEventTarget)(e)) || state.isKeyboardNavigationDisabled || !ref.current || !activeElement) return;
        let walker = (0, $9fb4ac1cc58342cc$exports.getFocusableTreeWalker)(ref.current);
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
                        (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                        (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                            containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                            (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
                            (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable = direction === 'rtl' ? walker.firstChild() : $83fb058f79cd147c$var$last(walker);
                            if (focusable) {
                                (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                                (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                                    containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                        (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                        (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                            containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                            (0, $4a053a4bf25e52fb$exports.focusSafely)(ref.current);
                            (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(ref.current, {
                                containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
                            });
                        } else {
                            walker.currentNode = ref.current;
                            focusable = direction === 'rtl' ? $83fb058f79cd147c$var$last(walker) : walker.firstChild();
                            if (focusable) {
                                (0, $4a053a4bf25e52fb$exports.focusSafely)(focusable);
                                (0, $9a1324d6ffd8bbb0$exports.scrollIntoViewport)(focusable, {
                                    containingElement: (0, $d865e4ff74ef4a73$exports.getScrollParent)(ref.current)
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
                if (!e.altKey && (0, $da02ee888921bc9e$exports.nodeContains)(ref.current, (0, $da02ee888921bc9e$exports.getEventTarget)(e))) {
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
        if ((0, $da02ee888921bc9e$exports.getEventTarget)(e) !== ref.current) {
            // useSelectableItem only handles setting the focused key when
            // the focused element is the gridcell itself. We also want to
            // set the focused key when a child element receives focus.
            // If focus is currently visible (e.g. the user is navigating with the keyboard),
            // then skip this. We want to restore focus to the previously focused row/cell
            // in that case since the table should act like a single tab stop.
            if (!(0, $d0df89f3abe2c2ca$exports.isFocusVisible)()) state.selectionManager.setFocusedKey(node.key);
            return;
        }
        // If the cell itself is focused, wait a frame so that focus finishes propagatating
        // up to the tree, and move focus to a focusable child if possible.
        requestAnimationFrame(()=>{
            if (focusMode === 'child' && (0, $da02ee888921bc9e$exports.getActiveElement)() === ref.current) focus();
        });
    };
    let gridCellProps = (0, $89b39774f3b79dbb$exports.mergeProps)(itemProps, {
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
function $83fb058f79cd147c$var$last(walker) {
    let next = null;
    let last = null;
    do {
        last = walker.lastChild();
        if (last) next = last;
    }while (last);
    return next;
}


//# sourceMappingURL=useGridCell.cjs.map
